const pool = require('../config/db');
const transporter = require('../config/email');
const sendSmsNetgsm = require('../utils/sms');
const { getWorkflowRecipients } = require('../utils/helpers');

const getWorkflows = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
        SELECT w.*, 
               u.first_name as creator_name, 
               u.last_name as creator_surname,
               u.email as creator_email,
               (
                  SELECT COALESCE(json_agg(
                      json_build_object(
                          'id', ua.id, 
                          'first_name', ua.first_name, 
                          'last_name', ua.last_name,
                          'email', ua.email
                      )
                  ), '[]'::json)
                  FROM workflow_assignees wa
                  JOIN users ua ON ua.id = wa.user_id
                  WHERE wa.workflow_id = w.id
               ) as assignees
        FROM workflows w
        JOIN users u ON w.creator_id = u.id
        WHERE w.creator_id = $1 
           OR EXISTS (
              SELECT 1 FROM workflow_assignees wa 
              WHERE wa.workflow_id = w.id AND wa.user_id = $1
           )
        ORDER BY w.created_at DESC
      `;

        const workflowsResult = await pool.query(query, [userId]);
        const workflows = workflowsResult.rows;

        for (let wf of workflows) {
            const stagesResult = await pool.query(`
          SELECT * FROM workflow_stages WHERE workflow_id = $1 ORDER BY created_at ASC
        `, [wf.id]);
            wf.stages = stagesResult.rows;
        }

        res.json(workflows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Sunucu hatası");
    }
};

const createWorkflow = async (req, res) => {
    try {
        const { title } = req.body;
        const creatorId = req.user.user_id;

        const result = await pool.query(
            'INSERT INTO workflows (title, creator_id) VALUES ($1, $2) RETURNING *',
            [title, creatorId]
        );

        const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [creatorId]);
        const user = userRes.rows[0];

        const newWorkflow = {
            ...result.rows[0],
            creator_name: user.first_name,
            creator_surname: user.last_name,
            stages: []
        };

        res.json(newWorkflow);
    } catch (err) {
        console.error(err);
        res.status(500).send("Ekleme hatası");
    }
};

const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
        res.json({ message: "Silindi" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Silme hatası");
    }
};

const updateWorkflow = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.user.user_id;

        await client.query('BEGIN');

        const wfCheck = await client.query('SELECT title FROM workflows WHERE id = $1', [id]);
        if (wfCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "İş akışı bulunamadı." });
        }
        const oldTitle = wfCheck.rows[0].title;

        await client.query('UPDATE workflows SET title = $1 WHERE id = $2', [title, id]);

        const senderRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
        const senderName = `${senderRes.rows[0].first_name} ${senderRes.rows[0].last_name}`;

        const recipients = await getWorkflowRecipients(client, id, userId);
        const message = `${senderName}, "${oldTitle}" iş akışının ismini "${title}" olarak değiştirdi.`;

        for (const recipient of recipients) {
            await client.query(`
              INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
              VALUES ($1, $2, $3, $4, 'workflow_update', $5)
          `, [recipient.user_id, userId, 'İş Akışı Güncellendi', message, id]);
        }

        await client.query('COMMIT');
        res.json({ message: "Güncellendi ve bildirimler gönderildi." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send("Güncelleme hatası");
    } finally {
        client.release();
    }
};

const createStage = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            workflow_id, title, description, customerName, customerPhone, customerEmail, sendSms, sendEmail
        } = req.body;

        const userId = req.user.user_id;

        await client.query('BEGIN');

        // 1. Aşamayı Veritabanına Kaydet
        const result = await client.query(
            `INSERT INTO workflow_stages (
          workflow_id, title, description, customer_name, customer_phone, customer_email, is_sms_enabled, is_email_enabled
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [workflow_id, title, description, customerName, customerPhone, customerEmail, sendSms, sendEmail]
        );
        const newStage = result.rows[0];

        // 2. İş Akışı Başlığını Al
        const wfRes = await client.query('SELECT title FROM workflows WHERE id = $1', [workflow_id]);
        const wfTitle = wfRes.rows[0]?.title || 'İş Akışı';

        // 3. İÇ BİLDİRİM
        const senderRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
        const senderName = `${senderRes.rows[0].first_name} ${senderRes.rows[0].last_name}`;

        const recipients = await getWorkflowRecipients(client, workflow_id, userId);
        const internalMessage = `${senderName}, "${wfTitle}" iş akışına "${title}" aşamasını ekledi.`;

        for (const recipient of recipients) {
            await client.query(`
              INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
              VALUES ($1, $2, $3, $4, 'workflow_update', $5)
          `, [recipient.user_id, userId, 'Yeni Aşama Eklendi', internalMessage, workflow_id]);
        }

        // 4. DIŞ BİLDİRİM: EMAIL
        let emailResult = null;
        if (sendEmail && customerEmail) {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: `İşleminiz Hakkında Bilgilendirme: ${title}`,
                html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
              <div style="text-align: center; border-bottom: 2px solid #D32F2F; padding-bottom: 15px; margin-bottom: 20px;">
                 <h2 style="color: #D32F2F; margin: 0; font-size: 24px;">LIG Sigorta</h2>
              </div>
              <p style="font-size: 16px; color: #333;">Sayın <b>${customerName}</b>,</p>
              <p style="font-size: 15px; color: #555; line-height: 1.5;">
                <b>${wfTitle}</b> dosyanızda yeni bir ilerleme kaydedildi. İşleminiz şu anda aşağıdaki aşamadadır:
              </p>
              <div style="background-color: #fdfdfd; padding: 20px; border-left: 5px solid #D32F2F; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #111; font-size: 18px;">${title}</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 0;">${description || 'Dosyanız ilgili birimimiz tarafından işlenmektedir.'}</p>
              </div>
              <p style="font-size: 13px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br>
                © 2026 LIG Sigorta
              </p>
            </div>
          `
            };
            try {
                await transporter.sendMail(mailOptions);
                emailResult = 'success';
            } catch (err) {
                console.error("Müşteri Mail Gönderim Hatası:", err);
                emailResult = 'error';
            }
        }

        // 5. DIŞ BİLDİRİM: SMS
        let smsResult = null;
        if (sendSms && customerPhone) {
            const smsMesaji = `Sayın ${customerName}, ${wfTitle} dosyanızda "${title}" aşamasına geçilmiştir. Bilginize.`;
            smsResult = await sendSmsNetgsm(customerPhone, smsMesaji);
        }

        await client.query('COMMIT');

        // Sonucu Genişletilmiş Olarak Dön
        res.json({
            ...newStage,
            notifications: {
                email: emailResult, // 'success', 'error' veya null
                sms: smsResult      // API yanıtı veya null
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Stage Post Error:", err);
        res.status(500).send("Aşama eklenirken sunucu hatası oluştu.");
    } finally {
        client.release();
    }
};

const updateStage = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, description, customerName, customerPhone, customerEmail, sendSms, sendEmail, assignees, forceNotification } = req.body;
        const userId = req.user.user_id;

        await client.query('BEGIN');

        const stageCheck = await client.query(`
          SELECT s.title, w.title as wf_title, w.id as workflow_id 
          FROM workflow_stages s 
          JOIN workflows w ON s.workflow_id = w.id 
          WHERE s.id = $1
      `, [id]);

        if (stageCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send("Aşama bulunamadı");
        }
        const { wf_title, workflow_id } = stageCheck.rows[0];

        const updatedStage = await client.query(`
        UPDATE workflow_stages 
        SET title = $1, description = $2, customer_name = $3, customer_phone = $4, customer_email = $5, is_sms_enabled = $6, is_email_enabled = $7
        WHERE id = $8 RETURNING *
      `, [title, description, customerName, customerPhone, customerEmail, sendSms, sendEmail, id]);

        const senderRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
        const senderName = `${senderRes.rows[0].first_name} ${senderRes.rows[0].last_name}`;
        const recipients = await getWorkflowRecipients(client, workflow_id, userId);
        const message = `${senderName}, "${wf_title}" iş akışındaki "${title}" aşamasını güncelledi.`;

        for (const recipient of recipients) {
            await client.query(`
              INSERT INTO notifications (user_id, sender_id, title, message, type) 
              VALUES ($1, $2, $3, $4, 'workflow_update')
          `, [recipient.user_id, userId, 'Aşama Güncellendi', message]);
        }

        // 4. DIŞ BİLDİRİM: EMAIL
        // forceNotification kontrolü eklendi: Eğer "Sadece Kaydet" denildiyse false gelir, gönderilmez.
        let emailResult = null;
        if (sendEmail && customerEmail && forceNotification) {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: `İşleminiz Hakkında Bilgilendirme: ${title}`,
                html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
              <div style="text-align: center; border-bottom: 2px solid #D32F2F; padding-bottom: 15px; margin-bottom: 20px;">
                 <h2 style="color: #D32F2F; margin: 0; font-size: 24px;">LIG Sigorta</h2>
              </div>
              <p style="font-size: 16px; color: #333;">Sayın <b>${customerName}</b>,</p>
              <p style="font-size: 15px; color: #555; line-height: 1.5;">
                <b>${wf_title}</b> dosyanızda yeni bir ilerleme kaydedildi. İşleminiz şu anda aşağıdaki aşamadadır:
              </p>
              <div style="background-color: #fdfdfd; padding: 20px; border-left: 5px solid #D32F2F; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #111; font-size: 18px;">${title}</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 0;">${description || 'Dosyanız ilgili birimimiz tarafından işlenmektedir.'}</p>
              </div>
              <p style="font-size: 13px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br>
                © 2026 LIG Sigorta
              </p>
            </div>
          `
            };
            try {
                await transporter.sendMail(mailOptions);
                emailResult = 'success';
            } catch (err) {
                console.error("Müşteri Mail Gönderim Hatası (Update):", err);
                emailResult = 'error';
            }
        }

        // 5. DIŞ BİLDİRİM: SMS
        // forceNotification kontrolü eklendi
        let smsResult = null;
        if (sendSms && customerPhone && forceNotification) {
            const smsMesaji = `Sayın ${customerName}, ${wf_title} dosyanızda "${title}" aşamasına geçilmiştir. Bilginize.`;
            smsResult = await sendSmsNetgsm(customerPhone, smsMesaji);
        }

        await client.query('COMMIT');
        const stageData = updatedStage.rows[0];
        stageData.assignees = assignees || [];

        // Update cevabında notification bilgisi dönüyoruz
        res.json({
            ...stageData,
            notifications: {
                email: emailResult,
                sms: smsResult
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send("Aşama güncelleme hatası");
    } finally {
        client.release();
    }
};

const deleteStage = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM workflow_stages WHERE id = $1', [id]);
        res.json({ message: "Aşama silindi" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Aşama silme hatası");
    }
};

const assignUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const senderId = req.user.user_id;

        await client.query('BEGIN');

        await client.query(`
            INSERT INTO workflow_assignees (workflow_id, user_id) 
            VALUES ($1, $2) 
            ON CONFLICT DO NOTHING
        `, [id, userId]);

        const infoRes = await client.query(`
            SELECT 
                (SELECT title FROM workflows WHERE id = $1) as wf_title,
                (SELECT first_name || ' ' || last_name FROM users WHERE id = $2) as sender_name
        `, [id, senderId]);

        const { wf_title, sender_name } = infoRes.rows[0];

        const message = `${sender_name}, sizi "${wf_title}" iş akışına görevli olarak ekledi.`;

        await client.query(`
            INSERT INTO notifications (user_id, sender_id, title, message, type, resource_id) 
            VALUES ($1, $2, $3, $4, 'workflow_update', $5)
        `, [
            userId,
            senderId,
            'Yeni Görev Ataması',
            message,
            id
        ]);

        const userRes = await client.query("SELECT id, first_name, last_name, email FROM users WHERE id = $1", [userId]);

        await client.query('COMMIT');
        res.json(userRes.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Görevli eklenemedi" });
    } finally {
        client.release();
    }
};

const removeUniqueUser = async (req, res) => {
    try {
        const { id, userId } = req.params;
        await pool.query("DELETE FROM workflow_assignees WHERE workflow_id = $1 AND user_id = $2", [id, userId]);
        res.json({ message: "Görevli silindi" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Silme hatası" });
    }
};

module.exports = {
    getWorkflows,
    createWorkflow,
    deleteWorkflow,
    updateWorkflow,
    createStage,
    updateStage,
    deleteStage,
    assignUser,
    removeUniqueUser
};
