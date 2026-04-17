const pool = require('../config/db');

const createTables = async () => {
    try {
        // 1. Kullanıcılar
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 2. Bildirimler
        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        resource_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 3. Ekip Üyeleri
        await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'Ekip Arkadaşı', 
        status VARCHAR(50) DEFAULT 'Aktif',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(manager_id, member_id)
      );
    `);

        // --- GÖREV YÖNETİMİ TABLOLARI ---

        // 4. Görevler (Ana Tablo)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Görevi oluşturan (Sahip)
        title VARCHAR(255) NOT NULL,
        description TEXT,
        customer_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Aktif',
        priority VARCHAR(50) DEFAULT 'Normal',
        priority_color VARCHAR(50),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        tags TEXT[], -- Etiketler dizi olarak tutulur
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 5. Görev Atamaları (Assignees)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 6. Görev Adımları (Steps)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_steps (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        text VARCHAR(255) NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE
      );
    `);

        // 7. Görev Dosyaları (Files - Metadata)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_files (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Eğer stored_name sütunu yoksa sonradan ekle (Eski verileri korumak için)
        await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_files' AND column_name='stored_name') THEN 
            ALTER TABLE task_files ADD COLUMN stored_name VARCHAR(255); 
          END IF; 
        END $$;
    `);

        // 8. Görev Aktiviteleri ve Yorumlar
        await pool.query(`
      CREATE TABLE IF NOT EXISTS task_activities (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        activity_type VARCHAR(20) DEFAULT 'system', -- 'system' (değişiklik) veya 'comment' (yorum)
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 9. İş Akışları (Ana Konteyner - Örn: Trafik Sigortası)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 10. İş Akışı Aşamaları
        await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_stages (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_email VARCHAR(255),
        is_sms_enabled BOOLEAN DEFAULT FALSE,
        is_email_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 11. İş Akışı Görevlileri
        await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_assignees (
        workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workflow_id, user_id)
      );
    `);

        // 12. Mesajlar (Sohbet Geçmişi)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        context_type VARCHAR(20) NOT NULL, -- 'task', 'workflow', 'team'
        context_id INTEGER NOT NULL,       -- Görev ID, İş Akışı ID veya Alıcı ID
        message_text TEXT NOT NULL,
        file_info JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 13. Yazışma Grupları
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 14. Yazışma Grubu Üyeleri
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_group_members (
        group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      );
    `);

        // 15. Müşteriler
        await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // İndeksleme
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_context ON messages(context_type, context_id);
    `);

        console.log('✅ Veritabanı Tabloları Hazır');
    } catch (err) {
        console.error('❌ Tablo Oluşturma Hatası:', err.message);
    }
};

module.exports = createTables;
