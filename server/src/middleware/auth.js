const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Token yok.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("⚠️ Token Geçersiz:", err.message);
            return res.status(403).json({ error: 'Oturum süresi doldu.' });
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
