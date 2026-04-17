const pool = require('../config/db');

const getCustomers = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
            SELECT * FROM customers
            WHERE creator_id = $1
            OR creator_id IN (
                SELECT member_id FROM team_members WHERE manager_id = $1
                UNION
                SELECT manager_id FROM team_members WHERE member_id = $1
            )
            ORDER BY created_at DESC
        `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Müşteriler alınamadı" });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { name, surname, phone, email } = req.body;
        const creatorId = req.user.user_id;

        const result = await pool.query(
            "INSERT INTO customers (creator_id, name, surname, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [creatorId, name, surname, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Müşteri eklenemedi" });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, phone, email } = req.body;

        const result = await pool.query(
            "UPDATE customers SET name = $1, surname = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *",
            [name, surname, phone, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Müşteri bulunamadı" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Müşteri güncellenemedi" });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Müşteri bulunamadı" });
        }

        res.json({ message: "Müşteri silindi" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Silme işlemi başarısız" });
    }
};

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
