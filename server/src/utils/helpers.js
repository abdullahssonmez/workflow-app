// --- YARDIMCI FONKSİYON: Sohbet Bağlamına Göre Alıcıları Bul ---
const getChatContextRecipients = async (client, contextType, contextId, senderId) => {
    let query = '';
    let params = [contextId, senderId];

    if (contextType === 'task') {
        // Görev: Sahibi + Atananlar
        query = `
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM task_assignees WHERE task_id = $1
                UNION
                SELECT owner_id AS user_id FROM tasks WHERE id = $1
            ) AS all_users WHERE user_id != $2
        `;
    } else if (contextType === 'workflow') {
        // İş Akışı: Oluşturan + Atananlar
        query = `
            SELECT DISTINCT user_id FROM (
                SELECT creator_id AS user_id FROM workflows WHERE id = $1
                UNION
                SELECT user_id FROM workflow_assignees WHERE workflow_id = $1
            ) AS all_users WHERE user_id != $2
        `;
    } else if (contextType === 'group') {
        // Grup: Tüm üyeler
        query = `
            SELECT user_id FROM chat_group_members 
            WHERE group_id = $1 AND user_id != $2
        `;
    } else if (contextType === 'team') {
        // DM: Sadece karşı taraf
        return [{ user_id: contextId }];
    }

    if (query) {
        const res = await client.query(query, params);
        return res.rows;
    }
    return [];
};

// --- YARDIMCI FONKSİYON: Bağlam Başlığını Bul (Bildirim Metni İçin) ---
const getContextTitle = async (client, contextType, contextId) => {
    if (contextType === 'task') {
        const res = await client.query('SELECT title FROM tasks WHERE id = $1', [contextId]);
        return res.rows[0]?.title || 'Görev';
    } else if (contextType === 'workflow') {
        const res = await client.query('SELECT title FROM workflows WHERE id = $1', [contextId]);
        return res.rows[0]?.title || 'İş Akışı';
    } else if (contextType === 'group') {
        const res = await client.query('SELECT name FROM chat_groups WHERE id = $1', [contextId]);
        return res.rows[0]?.name || 'Grup';
    }
    return '';
};

// --- YARDIMCI FONKSİYON: İş Akışı İle İlgili Kişileri Bul ---
const getWorkflowRecipients = async (client, workflowId, senderId) => {
    const res = await client.query(`
        SELECT DISTINCT user_id FROM (
            -- 1. İş Akışını Oluşturan
            SELECT creator_id as user_id FROM workflows WHERE id = $1
            UNION
            -- 2. İş Akışına Atanmış Görevliler
            SELECT user_id FROM workflow_assignees WHERE workflow_id = $1
        ) AS all_users
        WHERE user_id != $2
    `, [workflowId, senderId]);
    return res.rows;
};

module.exports = {
    getChatContextRecipients,
    getContextTitle,
    getWorkflowRecipients
};
