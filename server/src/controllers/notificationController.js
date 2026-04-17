const pool = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const notifications = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [req.user.user_id]);
        res.json(notifications.rows);
    } catch (err) { res.status(500).json({ error: 'Hata' }); }
};

const markAsRead = async (req, res) => {
    try {
        await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [req.params.id]);
        res.json({ message: "Okundu." });
    } catch (err) { res.status(500).json({ error: "Hata" }); }
};

const deleteNotifications = async (req, res) => {
    try {
        const { type } = req.query;
        const userId = req.user.user_id;

        if (type === 'messages') {
            await pool.query("DELETE FROM notifications WHERE user_id = $1 AND type LIKE 'message_%'", [userId]);
        } else if (type === 'system') {
            await pool.query("DELETE FROM notifications WHERE user_id = $1 AND type NOT LIKE 'message_%'", [userId]);
        } else {
            await pool.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
        }

        res.json({ message: "Bildirimler silindi." });
    } catch (err) {
        console.error("Bildirim silme hatası:", err);
        res.status(500).json({ error: "Hata" });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotifications
};
