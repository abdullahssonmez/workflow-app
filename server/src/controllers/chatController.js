const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const uploadFile = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Dosya yüklenemedi" });
    }

    // Map all uploaded files to the expected format
    const uploadedFiles = req.files.map(file => ({
        fileName: file.filename,
        originalName: file.originalname,
        type: file.mimetype
    }));

    res.json(uploadedFiles);
};

const getMessages = async (req, res) => {
    try {
        const { contextType, contextId } = req.params;
        const userId = req.user.user_id;
        let query = '';
        let params = [];

        if (contextType === 'team') {
            // Özel Mesajlaşma (DM) Geçmişi
            query = `
            SELECT m.*, u.first_name, u.last_name 
            FROM messages m JOIN users u ON m.sender_id = u.id
            WHERE m.context_type = 'team' 
              AND ((m.sender_id = $1 AND m.context_id = $2) OR (m.sender_id = $2 AND m.context_id = $1))
            ORDER BY m.created_at ASC
          `;
            params = [userId, contextId];
        } else {
            // Görev/İş Akışı/Grup Geçmişi
            query = `
            SELECT m.*, u.first_name, u.last_name 
            FROM messages m JOIN users u ON m.sender_id = u.id
            WHERE m.context_type = $1 AND m.context_id = $2
            ORDER BY m.created_at ASC
          `;
            params = [contextType, contextId];
        }

        const result = await pool.query(query, params);

        const formatted = result.rows.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            name: `${msg.first_name} ${msg.last_name}`,
            text: msg.message_text,
            file_info: msg.file_info,
            time: new Date(msg.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: msg.created_at, // Tarih ayrımı için eklendi
            avatar: msg.first_name[0]
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).send("Hata");
    }
};

const deleteMessages = async (req, res) => {
    try {
        const { contextType, contextId } = req.params;
        const userId = req.user.user_id;

        // 1. Önce silinecek mesajları bul 
        let selectQuery = '';
        let params = [];

        if (contextType === 'team') {
            selectQuery = `
                SELECT file_info FROM messages 
                WHERE context_type = 'team' 
                AND ((sender_id = $1 AND context_id = $2) OR (sender_id = $2 AND context_id = $1))
            `;
            params = [userId, contextId];
        } else {
            selectQuery = `
                SELECT file_info FROM messages WHERE context_type = $1 AND context_id = $2
            `;
            params = [contextType, contextId];
        }

        const messagesToDelete = await pool.query(selectQuery, params);

        // 2. Dosyaları Fiziksel Olarak Sil
        // server/src/controllers/chatController.js -> server/uploads
        messagesToDelete.rows.forEach(row => {
            if (row.file_info) {
                let files = row.file_info;
                if (typeof files === 'string') {
                    try { files = JSON.parse(files); } catch (e) { }
                }

                if (Array.isArray(files)) {
                    files.forEach(file => {
                        if (file.fileName) {
                            const filePath = path.join(__dirname, '../../uploads', file.fileName);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`🗑️ Dosya silindi: ${file.fileName}`);
                            }
                        }
                    });
                }
            }
        });

        // 3. Mesajları Veritabanından Sil
        if (contextType === 'team') {
            await pool.query(`
                DELETE FROM messages 
                WHERE context_type = 'team' 
                AND ((sender_id = $1 AND context_id = $2) OR (sender_id = $2 AND context_id = $1))
            `, [userId, contextId]);
        } else {
            await pool.query(
                "DELETE FROM messages WHERE context_type = $1 AND context_id = $2",
                [contextType, contextId]
            );
        }

        res.json({ message: "Sohbet geçmişi ve dosyalar temizlendi." });
    } catch (err) {
        console.error("Mesaj silme hatası:", err);
        res.status(500).json({ error: "Silme işlemi başarısız." });
    }
};

const getGroups = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const query = `
            SELECT cg.*,
            (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'first_name', u.first_name, 
                        'last_name', u.last_name
                    )
                ), '[]'::json)
                FROM chat_group_members cgm
                JOIN users u ON cgm.user_id = u.id
                WHERE cgm.group_id = cg.id
            ) as assignees
            FROM chat_groups cg
            WHERE EXISTS (
                SELECT 1 FROM chat_group_members cgm 
                WHERE cgm.group_id = cg.id AND cgm.user_id = $1
            )
            ORDER BY cg.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gruplar alınamadı" });
    }
};

const createGroup = async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, memberIds } = req.body;
        const creatorId = req.user.user_id;

        await client.query('BEGIN');

        const groupRes = await client.query(
            "INSERT INTO chat_groups (name, creator_id) VALUES ($1, $2) RETURNING *",
            [name, creatorId]
        );
        const newGroup = groupRes.rows[0];

        const allMembers = [...new Set([...memberIds, creatorId])];

        for (const uid of allMembers) {
            await client.query(
                "INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2)",
                [newGroup.id, uid]
            );
        }

        const membersRes = await client.query(`
            SELECT first_name, last_name FROM users WHERE id = ANY($1::int[])
        `, [allMembers]);

        newGroup.assignees = membersRes.rows;

        // --- YENİ: GRUP OLUŞTURULDUĞUNDA ÜYELERE BİLDİRİM GÖNDER ---
        const senderInfo = membersRes.rows.find(u => u.id === creatorId) // Bu veriyi users tablosundan çekmek daha garanti olabilir ama şimdilik buradan deneyelim.
        // Aslında creatorId'den isim bulmak lazım, yukarıdaki query'de creator da var.

        // Gönderen ismini bulmak için tekrar sorgu yapalım garanti olsun
        const creatorRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [creatorId]);
        const creatorName = creatorRes.rows[0] ? `${creatorRes.rows[0].first_name} ${creatorRes.rows[0].last_name}` : 'Bir kullanıcı';

        for (const uid of memberIds) {
            if (uid === creatorId) continue;

            await client.query(`
                INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
                VALUES ($1, $2, $3, $4, 'message_group', $5)
            `, [
                uid,
                creatorId,
                'Yeni Sohbet Grubu',
                `${creatorName} sizi "${name}" grubuna ekledi.`,
                newGroup.id
            ]);
        }
        // -----------------------------------------------------------

        await client.query('COMMIT');
        res.status(201).json(newGroup);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Grup oluşturulamadı" });
    } finally {
        client.release();
    }
};

const deleteGroup = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        const messagesResult = await client.query(
            "SELECT file_info FROM messages WHERE context_type = 'group' AND context_id = $1",
            [id]
        );

        messagesResult.rows.forEach(row => {
            if (row.file_info) {
                let files = row.file_info;
                if (typeof files === 'string') {
                    try { files = JSON.parse(files); } catch (e) { }
                }

                if (Array.isArray(files)) {
                    files.forEach(file => {
                        if (file.fileName) {
                            const filePath = path.join(__dirname, '../../uploads', file.fileName);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`🗑️ Grup dosyası silindi: ${file.fileName}`);
                            }
                        }
                    });
                }
            }
        });

        await client.query("DELETE FROM messages WHERE context_type = 'group' AND context_id = $1", [id]);
        await client.query("DELETE FROM chat_groups WHERE id = $1", [id]);

        await client.query('COMMIT');
        res.json({ message: "Grup, mesajlar ve dosyalar silindi." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Grup silme hatası:", err);
        res.status(500).json({ error: "Grup silinemedi." });
    } finally {
        client.release();
    }
};

module.exports = {
    uploadFile,
    getMessages,
    deleteMessages,
    getGroups,
    createGroup,
    deleteGroup
};
