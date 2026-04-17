
const path = require('path');
// 1. Load env vars FIRST
// server/.env is in the same directory as this script (server/)
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 2. Then require the config which uses those vars
// email.js is in src/config/email.js
const transporter = require('./src/config/email');

async function verifyEmail() {
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('User:', process.env.EMAIL_USER);

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.error('❌ Environment variables missing! Check .env file');
        return;
    }

    try {
        // 1. Verify connection configuration
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');

        // 2. Send test email
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'SMTP Test - LIG SIGORTA',
            text: 'Bu bir test e-postasidir. SMTP baglantisi basariyla saglandi.',
        });

        console.log('✅ Test email sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error occurred:', error);
    }
}

verifyEmail();
