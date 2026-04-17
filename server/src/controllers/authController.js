const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/email');
require('dotenv').config();

const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) return res.status(401).json({ error: "E-posta kayıtlı!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
            [first_name, last_name, email, hashedPassword]
        );
        res.json({ message: "Kayıt Başarılı!", user: newUser.rows[0] });
    } catch (err) { res.status(500).send("Hata"); }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (users.rows.length === 0) return res.status(401).json({ error: "Hatalı bilgi!" });

        const validPassword = await bcrypt.compare(password, users.rows[0].password);
        if (!validPassword) return res.status(401).json({ error: "Hatalı bilgi!" });

        // Token Süresi: 30 Gün
        const token = jwt.sign({ user_id: users.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "30d" });

        res.json({ message: "Giriş Başarılı!", token: token, user: users.rows[0] });
    } catch (err) {
        console.error("Login Error Details:", err);
        res.status(500).send("Hata");
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Kullanıcıyı Bul
        const userCheck = await pool.query("SELECT id, first_name, last_name, email FROM users WHERE email = $1", [email]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Bu e-posta adresi sistemde kayıtlı değil." });
        }

        const user = userCheck.rows[0];
        const fullName = `${user.first_name} ${user.last_name}`;

        // Token Oluştur
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/login?resetToken=${resetToken}`;

        const uniqueId = new Date().getTime();

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Şifrenizi Yenileyin',
            html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 50px 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              
              <h2 style="color: #111827; text-align: center; margin-top: 0; margin-bottom: 40px; font-size: 24px; font-weight: bold;">LIG Sigorta</h2>
              
              <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Sayın <strong>${fullName}</strong>,</p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Şifrenizi yenilemek için aşağıdaki butona tıklayın. Eğer şifrenizi değiştirmek istemiyorsanız bu e-postayı görmezden gelebilirsiniz.
              </p>
  
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${resetLink}" style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">
                  Şifrenizi Yenileyin
                </a>
              </div>
  
              <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Bu e-posta LIG Sigorta hesabınız için gönderilmiştir.<br>
                  © 2026 LIG Sigorta
                </p>
              </div>
  
              <div style="display: none; opacity: 0; color: transparent; height: 0; width: 0; font-size: 1px;">
                 Mail ID: ${uniqueId}
              </div>
  
            </div>
          </div>
        `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[MAIL GÖNDERİLDİ] -> ${email}`);
        res.json({ message: "Şifre yenileme linki gönderildi." });

    } catch (err) {
        console.error("Mail Hatası:", err);
        res.status(500).json({ error: "Mail gönderilirken hata oluştu." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Eksik bilgi." });
        }

        // Token'ı Doğrula
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: "Link geçersiz veya süresi dolmuş." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, decoded.id]);

        res.json({ message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });

    } catch (err) {
        console.error("Şifre Reset Hatası:", err);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
