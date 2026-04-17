const axios = require('axios');
require('dotenv').config();

const sendSmsNetgsm = async (phone, message) => {
    try {
        if (!phone) return;

        // 1. Telefon Temizliği
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
        if (cleanPhone.length !== 10) {
            console.error("SMS Hatası: Geçersiz telefon numarası ->", phone);
            return;
        }

        // 2. XML Verisini Hazırla (Türkçe Karakter Destekli)
        const xmlData = `<?xml version="1.0"?>
        <mainbody>
            <header>
                <company dil="TR">Netgsm</company> 
                <usercode>${process.env.NETGSM_USER}</usercode>
                <password>${process.env.NETGSM_PASS}</password>
                <type>1:n</type>
                <msgheader>${process.env.NETGSM_HEADER}</msgheader>
            </header>
            <body>
                <msg><![CDATA[${message}]]></msg>
                <no>${cleanPhone}</no>
            </body>
        </mainbody>`;

        // 3. API İsteği
        const response = await axios.post('https://api.netgsm.com.tr/sms/send/xml', xmlData, {
            headers: { 'Content-Type': 'text/xml' }
        });

        // 4. Sonuç Loglama
        console.log(`📨 SMS Gönderildi (${cleanPhone}) - Cevap: ${response.data}`);
        return response.data;

    } catch (error) {
        console.error('❌ SMS Gönderim Hatası:', error.message);
        return null;
    }
};

module.exports = sendSmsNetgsm;
