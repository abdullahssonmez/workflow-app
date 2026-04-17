const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail için Nodemailer konfigürasyonu
// Not: Gerçek projelerde .env kullanılması şiddetle önerilir.
// Corporate SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // 465 için true, 587 için false
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = transporter;
