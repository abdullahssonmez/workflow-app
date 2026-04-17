const pool = require('../config/db');
const bcrypt = require('bcrypt');

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { first_name, last_name } = req.body;

        const result = await pool.query(
            "UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, first_name, last_name, email",
            [first_name, last_name, userId]
        );
        res.json({ message: "Profil güncellendi.", user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Güncelleme başarısız." });
    }
};

const verifyPassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { password } = req.body;

        const userRes = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const validPassword = await bcrypt.compare(password, userRes.rows[0].password);

        if (validPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: "Şifre yanlış." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

const updateEmail = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { email } = req.body;

        const check = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, userId]);
        if (check.rows.length > 0) return res.status(400).json({ error: "Bu e-posta zaten kullanımda." });

        const result = await pool.query(
            "UPDATE users SET email = $1 WHERE id = $2 RETURNING id, first_name, last_name, email",
            [email, userId]
        );
        res.json({ message: "E-posta güncellendi.", user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "E-posta güncellenemedi." });
    }
};

const updatePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
        res.json({ message: "Şifre başarıyla değiştirildi." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Şifre değiştirilemedi." });
    }
};

module.exports = {
    updateProfile,
    verifyPassword,
    updateEmail,
    updatePassword
};
