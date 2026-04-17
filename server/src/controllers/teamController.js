const pool = require('../config/db');

const getTeam = async (req, res) => {
    try {
        const myId = req.user.user_id;
        const team = await pool.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, 'Ekip Arkadaşı' as role, tm.status
        FROM team_members tm JOIN users u ON tm.member_id = u.id WHERE tm.manager_id = $1
        UNION
        SELECT u.id, u.first_name, u.last_name, u.email, 'Ekip Arkadaşı' as role, tm.status
        FROM team_members tm JOIN users u ON tm.manager_id = u.id WHERE tm.member_id = $1
      `, [myId]);
        res.json(team.rows);
    } catch (err) { res.status(500).json({ error: 'Hata' }); }
};

const inviteMember = async (req, res) => {
    try {
        const senderId = req.user.user_id;
        const targetEmail = req.body.email;
        if (!targetEmail) return res.status(400).json({ error: 'E-posta gerekli.' });

        const senderInfo = await pool.query('SELECT email, first_name, last_name FROM users WHERE id = $1', [senderId]);
        const sender = senderInfo.rows[0];
        if (sender.email.toLowerCase() === targetEmail.trim().toLowerCase()) return res.status(400).json({ error: 'Kendinize davet atamazsınız.' });

        const targetUserCheck = await pool.query('SELECT * FROM users WHERE email = $1', [targetEmail]);
        if (targetUserCheck.rows.length > 0) {
            const targetUserId = targetUserCheck.rows[0].id;
            const existing = await pool.query("SELECT * FROM team_members WHERE (manager_id = $1 AND member_id = $2) OR (manager_id = $2 AND member_id = $1)", [senderId, targetUserId]);
            if (existing.rows.length > 0) return res.status(400).json({ error: 'Zaten ekiptesiniz.' });

            await pool.query("INSERT INTO notifications (user_id, sender_id, title, message, type) VALUES ($1, $2, $3, $4, $5)", [targetUserId, senderId, 'Ekip Daveti', `${sender.first_name} ${sender.last_name} sizi ekibine çağırıyor.`, 'invite']);
            res.status(200).json({ message: 'Davet gönderildi.' });
        } else { res.status(404).json({ error: 'Kullanıcı bulunamadı.' }); }
    } catch (err) {
        console.error("Invite Member Error:", err);
        res.status(500).json({ error: 'Hata' });
    }
};

const respondToInvite = async (req, res) => {
    try {
        const myId = req.user.user_id;
        const { notificationId, action } = req.body;
        const notifCheck = await pool.query('SELECT * FROM notifications WHERE id = $1', [notificationId]);
        if (notifCheck.rows.length === 0) return res.status(404).json({ error: 'Bildirim yok.' });

        const managerId = notifCheck.rows[0].sender_id;
        if (action === 'accept' && managerId) {
            await pool.query("INSERT INTO team_members (manager_id, member_id, role) VALUES ($1, $2, 'Ekip Arkadaşı') ON CONFLICT DO NOTHING", [managerId, myId]);
        }
        await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [notificationId]);
        res.json({ message: 'İşlem tamam.' });
    } catch (err) { res.status(500).json({ error: 'Hata' }); }
};

const deleteMember = async (req, res) => {
    try {
        const targetId = req.params.id;
        const myId = req.user.user_id;

        const result = await pool.query(`
            DELETE FROM team_members 
            WHERE (manager_id = $1 AND member_id = $2) 
               OR (manager_id = $2 AND member_id = $1)
        `, [myId, targetId]);

        res.json({ message: "Ekip üyesi başarıyla silindi." });
    } catch (err) {
        console.error("Ekip silme hatası:", err);
        res.status(500).json({ error: "Silme işlemi sırasında hata oluştu." });
    }
};

module.exports = {
    getTeam,
    inviteMember,
    respondToInvite,
    deleteMember
};
