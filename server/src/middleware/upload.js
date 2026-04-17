const multer = require('multer');
const path = require('path');
const fs = require('fs');

// server/src/middleware/upload.js olduğundan, server root'a (index.js yanına) çıkmak için ../..
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Dosya adını benzersiz yap: zamandamgası-orijinalad
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Türkçe karakter sorununu önlemek için basit bir encoding (opsiyonel ama önerilir)
        const originalName = file.originalname.replace(/\s+/g, '-');
        cb(null, uniqueSuffix + '-' + originalName)
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
