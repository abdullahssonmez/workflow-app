const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const createTask = async (req, res) => {
    const client = await pool.connect();
    try {
        const ownerId = req.user.user_id;
        const { title, description, customerName, status, priority, priorityColor, startDate, endDate } = req.body;

        const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
        const assigneeIds = req.body.assigneeIds ? JSON.parse(req.body.assigneeIds) : [];
        const steps = req.body.steps ? JSON.parse(req.body.steps) : [];

        const uploadedFiles = req.files || [];

        await client.query('BEGIN');

        // 2. Ana Görevi Kaydet
        const taskResult = await client.query(`
            INSERT INTO tasks (owner_id, title, description, customer_name, status, priority, priority_color, start_date, end_date, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            ownerId,
            title,
            description,
            customerName,
            status,
            priority,
            priorityColor,
            startDate || null,
            endDate || null,
            tags
        ]);

        const taskId = taskResult.rows[0].id;

        // 3. Görevlileri (Assignees) Kaydet
        if (assigneeIds && assigneeIds.length > 0) {
            for (const userId of assigneeIds) {
                await client.query(
                    "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
                    [taskId, userId]
                );
            }
        }

        // 4. Adımları (Steps) Kaydet
        if (steps && steps.length > 0) {
            for (const step of steps) {
                await client.query(
                    "INSERT INTO task_steps (task_id, text, description, is_completed) VALUES ($1, $2, $3, $4)",
                    [taskId, step.text, step.description || '', step.completed || false]
                );
            }
        }

        // 5. Dosyaları (Files) Kaydet
        if (uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                await client.query(
                    "INSERT INTO task_files (task_id, file_name, stored_name, file_type) VALUES ($1, $2, $3, $4)",
                    [taskId, file.originalname, file.filename, file.mimetype]
                );
            }
        }

        // 6. Bildirim Gönderme
        if (assigneeIds && assigneeIds.length > 0) {
            const senderRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [ownerId]);
            const senderName = senderRes.rows[0] ? `${senderRes.rows[0].first_name} ${senderRes.rows[0].last_name}` : 'Bir yönetici';

            for (const userId of assigneeIds) {
                if (userId === ownerId) continue;
                const message = `${senderName}, size yeni bir görev atadı: "${title}"`;

                await client.query(`
                    INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
                    VALUES ($1, $2, $3, $4, 'task_update', $5)
                `, [
                    userId,
                    ownerId,
                    'Yeni Görev Ataması',
                    message,
                    taskId
                ]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Görev başarıyla oluşturuldu ve atanan kişilere bildirildi.', taskId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Task Create Error:", err);
        res.status(500).json({ error: 'Görev oluşturulurken hata oluştu.' });
    } finally {
        client.release();
    }
};

const getTasks = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
            SELECT t.*,
            (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'first_name', u.first_name, 
                        'last_name', u.last_name
                    )
                ), '[]'::json)
                FROM task_assignees ta
                JOIN users u ON ta.user_id = u.id
                WHERE ta.task_id = t.id
            ) as assignees
            FROM tasks t
            LEFT JOIN task_assignees ta_own ON t.id = ta_own.task_id
            WHERE t.owner_id = $1 OR ta_own.user_id = $1
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows);

    } catch (err) {
        console.error("Task Fetch Error:", err);
        res.status(500).json({ error: 'Görevler alınırken hata oluştu.' });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Görev Ana Bilgileri
        const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Görev bulunamadı.' });
        const task = taskRes.rows[0];

        // 2. Görevliler
        const assigneesRes = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email 
            FROM task_assignees ta 
            JOIN users u ON ta.user_id = u.id 
            WHERE ta.task_id = $1
        `, [id]);

        // 3. Adımlar
        const stepsRes = await pool.query('SELECT * FROM task_steps WHERE task_id = $1 ORDER BY id ASC', [id]);

        // 4. Dosyaları
        const filesRes = await pool.query('SELECT * FROM task_files WHERE task_id = $1 ORDER BY uploaded_at DESC', [id]);

        // 5. Sahip Bilgisi
        const ownerRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [task.owner_id]);
        const owner = ownerRes.rows[0];

        res.json({
            ...task,
            assignees: assigneesRes.rows,
            steps: stepsRes.rows,
            files: filesRes.rows,
            ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Bilinmiyor'
        });

    } catch (err) {
        console.error("Task Detail Error:", err);
        res.status(500).json({ error: 'Görev detayları alınırken hata oluştu.' });
    }
};

const updateTask = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const {
            title, description, customerName, status,
            priority, priorityColor, startDate, endDate,
            newComment
        } = req.body;

        const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
        const assigneeIds = req.body.assigneeIds ? JSON.parse(req.body.assigneeIds) : [];
        const steps = req.body.steps ? JSON.parse(req.body.steps) : [];
        const deletedFileIds = req.body.deletedFileIds ? JSON.parse(req.body.deletedFileIds) : [];
        const newUploadedFiles = req.files || [];

        await client.query('BEGIN');

        // 1. ESKİ VERİYİ ÇEK 
        const oldTaskRes = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (oldTaskRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Görev bulunamadı" });
        }
        const oldTask = oldTaskRes.rows[0];
        const oldStepsRes = await client.query('SELECT text, is_completed FROM task_steps WHERE task_id = $1 ORDER BY id ASC', [id]);
        const oldSteps = oldStepsRes.rows;

        // 2. GÖREVİ GÜNCELLE
        await client.query(`
            UPDATE tasks 
            SET title = $1, description = $2, customer_name = $3, 
                status = $4, priority = $5, priority_color = $6, 
                start_date = $7, end_date = $8, tags = $9
            WHERE id = $10
        `, [
            title, description, customerName, status,
            priority, priorityColor, startDate || null, endDate || null,
            tags, id
        ]);

        // 3. AKTİVİTE LOGLARI
        const activityQuery = "INSERT INTO task_activities (task_id, user_id, activity_type, message) VALUES ($1, $2, 'system', $3)";

        const areDatesEqual = (d1, d2) => {
            const time1 = d1 ? new Date(d1).getTime() : 0;
            const time2 = d2 ? new Date(d2).getTime() : 0;
            return Math.abs(time1 - time2) < 60000;
        };

        if (oldTask.status !== status) await client.query(activityQuery, [id, userId, `görevin durumunu değiştirdi: ${status}`]);
        if (oldTask.priority !== priority) await client.query(activityQuery, [id, userId, `görevin önceliğini değiştirdi: ${priority}`]);
        if (oldTask.title !== title) await client.query(activityQuery, [id, userId, `görevin başlığını güncelledi.`]);
        if ((oldTask.customer_name || '') !== (customerName || '')) await client.query(activityQuery, [id, userId, `müşteri ismini güncelledi: ${customerName || 'Belirtilmedi'}`]);
        if (!areDatesEqual(oldTask.start_date, startDate)) await client.query(activityQuery, [id, userId, `başlangıç tarihini güncelledi.`]);
        if (!areDatesEqual(oldTask.end_date, endDate)) await client.query(activityQuery, [id, userId, `bitiş tarihini güncelledi.`]);

        // 4. İLİŞKİLİ TABLOLARI GÜNCELLE
        // Assignees
        await client.query('DELETE FROM task_assignees WHERE task_id = $1', [id]);
        if (assigneeIds && assigneeIds.length > 0) {
            for (const uid of assigneeIds) {
                await client.query("INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)", [id, uid]);
            }
        }

        // Steps
        let stepsChanged = false;
        if (steps) {
            const newStepsSimple = steps.map(s => s.text + s.completed).join('|');
            const oldStepsSimple = oldSteps.map(s => s.text + s.is_completed).join('|');
            if (newStepsSimple !== oldStepsSimple) stepsChanged = true;
        }
        await client.query('DELETE FROM task_steps WHERE task_id = $1', [id]);
        if (steps && steps.length > 0) {
            for (const step of steps) {
                await client.query("INSERT INTO task_steps (task_id, text, description, is_completed) VALUES ($1, $2, $3, $4)", [id, step.text, step.description || '', step.completed || false]);
            }
        }
        if (stepsChanged) await client.query(activityQuery, [id, userId, `görev adımlarını güncelledi.`]);

        // YENİ DOSYALARI EKLEME
        if (newUploadedFiles.length > 0) {
            for (const file of newUploadedFiles) {
                await client.query(
                    "INSERT INTO task_files (task_id, file_name, stored_name, file_type) VALUES ($1, $2, $3, $4)",
                    [id, file.originalname, file.filename, file.mimetype]
                );
            }
            await client.query(activityQuery, [id, userId, `yeni dosyalar yükledi.`]);
        }

        // 5. DOSYA SİLME İŞLEMİ
        if (deletedFileIds && deletedFileIds.length > 0) {
            const filesToDeleteRes = await client.query("SELECT stored_name FROM task_files WHERE id = ANY($1::int[])", [deletedFileIds]);
            await client.query("DELETE FROM task_files WHERE id = ANY($1::int[])", [deletedFileIds]);

            // Fiziksel dosyayı klasörden sil - Path sorunu olmaması için ../../../ düzeltmesi gerekebilir ama
            // index.js ile aynı seviyeye çıkıp uploads klasörünü bulmalıyız.
            // server/src/controllers/taskController.js -> server/uploads
            // path.join(__dirname, '../../uploads')
            filesToDeleteRes.rows.forEach(f => {
                if (f.stored_name) {
                    const filePath = path.join(__dirname, '../../uploads', f.stored_name);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.error(`Dosya silinemedi (Update): ${f.stored_name}`, err);
                        }
                    }
                }
            });
        }

        // 6. YORUM İŞLEME
        let commentAdded = false;
        if (newComment && newComment.trim().length > 0) {
            await client.query(
                "INSERT INTO task_activities (task_id, user_id, activity_type, message) VALUES ($1, $2, 'comment', $3)",
                [id, userId, newComment]
            );
            commentAdded = true;
        }

        // 7. BİLDİRİM GÖNDERME
        const senderRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
        const senderName = senderRes.rows[0] ? `${senderRes.rows[0].first_name} ${senderRes.rows[0].last_name}` : 'Bir kullanıcı';

        const recipientsRes = await client.query(`
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM task_assignees WHERE task_id = $1
                UNION
                SELECT owner_id AS user_id FROM tasks WHERE id = $1
            ) AS all_users
            WHERE user_id != $2
        `, [id, userId]);

        let notificationMessage = `${senderName}, ${title} görevinde güncellemeler yaptı.`;
        if (commentAdded) notificationMessage = `${senderName}, ${title} görevinde güncelleme yaptı ve yeni bir not ekledi.`;

        for (const recipient of recipientsRes.rows) {
            await client.query(`
                INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
                VALUES ($1, $2, $3, $4, 'task_update', $5)
            `, [
                recipient.user_id,
                userId,
                `Görev Güncellendi`,
                notificationMessage,
                id
            ]);
        }

        await client.query('COMMIT');
        res.json({ message: 'İşlem tamamlandı.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Task Update Error:", err);
        res.status(500).json({ error: 'Güncelleme hatası.' });
    } finally {
        client.release();
    }
};

const getTaskActivities = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT ta.*, u.first_name, u.last_name 
            FROM task_activities ta
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = $1
            ORDER BY ta.created_at ASC 
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Aktiviteler alınamadı.' });
    }
};

const addTaskComment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.user.user_id;

        await client.query('BEGIN');

        // 1. Yorumu Activity Olarak Ekle
        await client.query(
            "INSERT INTO task_activities (task_id, user_id, activity_type, message) VALUES ($1, $2, 'comment', $3)",
            [id, userId, message]
        );

        // 2. Görev Başlığını ve Yorum Yapanı Bul
        const taskInfo = await client.query(`
            SELECT t.title, u.first_name, u.last_name 
            FROM tasks t 
            JOIN users u ON u.id = $1
            WHERE t.id = $2
        `, [userId, id]);

        if (taskInfo.rows.length > 0) {
            const { title, first_name, last_name } = taskInfo.rows[0];
            const senderName = `${first_name} ${last_name}`;

            // 3. Alıcıları Bul
            const recipientsRes = await client.query(`
                SELECT DISTINCT user_id FROM (
                    SELECT user_id FROM task_assignees WHERE task_id = $1
                    UNION
                    SELECT owner_id AS user_id FROM tasks WHERE id = $1
                ) AS all_users
                WHERE user_id != $2
            `, [id, userId]);

            // 4. Bildirimleri Gönder
            for (const recipient of recipientsRes.rows) {
                const shortMsg = message.length > 50 ? message.substring(0, 47) + '...' : message;

                await client.query(`
                    INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
                    VALUES ($1, $2, $3, $4, 'task_comment', $5)
                `, [
                    recipient.user_id,
                    userId,
                    `Yeni Yorum: ${title}`,
                    `${senderName}: "${shortMsg}"`,
                    id
                ]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Yorum eklendi ve bildirim gönderildi.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Yorum eklenirken hata oluştu.' });
    } finally {
        client.release();
    }
};

const deleteTask = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Önce bu göreve ait dosyaların sunucudaki isimlerini bul
        const filesRes = await client.query('SELECT stored_name FROM task_files WHERE task_id = $1', [id]);

        // 2. Fiziksel dosyaları sil
        // server/src/controllers/taskController.js -> server/uploads
        filesRes.rows.forEach(file => {
            if (file.stored_name) {
                const filePath = path.join(__dirname, '../../uploads', file.stored_name);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Dosya silindi: ${file.stored_name}`);
                    } catch (err) {
                        console.error(`Dosya silinemedi: ${file.stored_name}`, err);
                    }
                }
            }
        });

        // 3. Görevi veritabanından sil
        const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Görev bulunamadı.' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Görev ve ilişkili tüm dosyalar başarıyla silindi.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Task Delete Error:", err);
        res.status(500).json({ error: 'Silme işlemi sırasında sunucu hatası.' });
    } finally {
        client.release();
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    getTaskActivities,
    addTaskComment,
    deleteTask
};
