const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
require('dotenv').config();

// Config & DB
const pool = require('./src/config/db');
const createTables = require('./src/db/init');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const workflowRoutes = require('./src/routes/workflowRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

// Utils
const { getChatContextRecipients, getContextTitle } = require('./src/utils/helpers');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Statik Dosyalar (Uploads klasörünü dışarıya açıyoruz - İsteğe bağlı, güvenlik için kapalı tutulabilir)
// Ancak frontend'den erişim için gerekebilir.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dosya İndirme Route - Auth middleware'lerine takılmaması için üstte tanımlandı
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Orijinal dosya adını ayrıştır (Format: timestamp-random-originalName)
    // Örnek: 1768341858031-119106739-.env -> .env
    const parts = filename.split('-');
    let originalName = filename;

    if (parts.length >= 3) {
        // İlk 2 parça (timestamp ve random) hariç kalanı birleştir
        originalName = parts.slice(2).join('-');
    }

    res.download(filePath, originalName, (err) => {
        if (err) {
            console.error('Download Error:', err);
            if (!res.headersSent) res.status(404).send('Dosya bulunamadı.');
        }
    });
});

// Routes Mounting
app.use('/', authRoutes);             // /login, /register, /forgot-password
app.use('/tasks', taskRoutes);        // /tasks...
app.use('/notifications', notificationRoutes); // /notifications...
app.use('/team', teamRoutes);         // /team...
app.use('/customers', customerRoutes);// /customers...
app.use('/profile', profileRoutes);   // /profile...
app.use('/', workflowRoutes);         // /workflows, /stages (Legacy structure preserved)
app.use('/', chatRoutes);             // /chat/upload, /messages, /groups

// Health Check
app.get('/', (req, res) => {
    res.send('Workflow App Backend is Running...');
});




// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('🔵 Kullanıcı bağlandı:', socket.id);

    // Odaya Katılma
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Odaya katıldı: ${room}`);
    });

    socket.on('send_message', async (data) => {
        const client = await pool.connect();
        try {
            const fileInfoData = data.file_info && data.file_info.length > 0
                ? JSON.stringify(data.file_info)
                : null;

            const messageText = data.message || "";

            // 1. MESAJI KAYDET
            const query = `
          INSERT INTO messages (sender_id, context_type, context_id, message_text, file_info) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *, 
          (SELECT first_name FROM users WHERE id = $1) as sender_name, 
          (SELECT last_name FROM users WHERE id = $1) as sender_surname
        `;

            const result = await client.query(query, [
                data.sender_id,
                data.context_type,
                data.context_id,
                messageText,
                fileInfoData
            ]);
            const savedMsg = result.rows[0];

            // 2. SOCKET İLE İLET
            const msgToSend = {
                ...savedMsg,
                name: `${savedMsg.sender_name} ${savedMsg.sender_surname}`,
                text: savedMsg.message_text,
                file_info: savedMsg.file_info,
                time: new Date(savedMsg.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                sender_id: data.sender_id
            };

            io.to(data.room).emit('receive_message', msgToSend);

            // 3. BİLDİRİM GÖNDER
            const recipients = await getChatContextRecipients(client, data.context_type, data.context_id, data.sender_id);
            const contextTitle = await getContextTitle(client, data.context_type, data.context_id);

            let notificationTitle = contextTitle || "Yeni Mesaj";

            let contentSummary = "";
            if (data.file_info && data.file_info.length > 0) {
                contentSummary = `${savedMsg.sender_name}: 📁 Dosya gönderdi`;
            } else {
                contentSummary = `${savedMsg.sender_name}: "${messageText.substring(0, 40)}${messageText.length > 40 ? '...' : ''}"`;
            }

            // DÜZELTME: Eğer bu bir 'team' mesajı ise, alıcının tıklayınca açması gereken kişi 'gönderen'dir.
            // Diğer durumlarda (grup, görev) resource_id, context_id'nin kendisidir.
            const resourceId = data.context_type === 'team' ? data.sender_id : data.context_id;

            for (const recipient of recipients) {
                await client.query(`
                INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                    recipient.user_id,
                    data.sender_id,
                    notificationTitle,
                    contentSummary,
                    `message_${data.context_type}`,
                    resourceId
                ]);
            }

        } catch (err) {
            console.error("Mesaj hatası:", err);
        } finally {
            client.release();
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Kullanıcı ayrıldı:', socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Veritabanı tablolarını oluştur ve sunucuyu başlat
createTables().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Sunucu ve Socket.io ${PORT} portunda aktif!`);
    });
});