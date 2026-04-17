const pool = require('../src/config/db');

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('⚠️  VERİTABANI SIFIRLANIYOR... BU İŞLEM GERİ ALINAMAZ! ⚠️');

        // Tüm tabloları temizle (CASCADE ile bağlı veriler de silinir)
        // RESTART IDENTITY: ID sayaçlarını 1'e sıfırlar.
        const query = `
      TRUNCATE TABLE 
        users, 
        notifications, 
        team_members, 
        tasks, 
        task_assignees, 
        task_steps, 
        task_files, 
        task_activities, 
        workflows, 
        workflow_stages, 
        workflow_assignees, 
        messages, 
        chat_groups, 
        chat_group_members, 
        customers
      RESTART IDENTITY CASCADE;
    `;

        await client.query(query);

        console.log('✅ Veritabanı başarıyla sıfırlandı. Tüm veriler silindi.');
    } catch (err) {
        console.error('❌ Sıfırlama hatası:', err);
    } finally {
        client.release();
        process.exit();
    }
}

resetDatabase();
