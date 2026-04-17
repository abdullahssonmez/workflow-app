const { body, validationResult } = require('express-validator');

// Validation Validator Middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return the first error message to keep it simple for the frontend
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- VALIDATION RULES ---

const registerValidation = [
    body('first_name').trim().notEmpty().withMessage('Ad alanı zorunludur.'),
    body('last_name').trim().notEmpty().withMessage('Soyad alanı zorunludur.'),
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır.')
];

const loginValidation = [
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('password').notEmpty().withMessage('Şifre giriniz.')
];

const taskValidation = [
    body('title').trim().notEmpty().withMessage('Görev başlığı zorunludur.'),
    body('priority').optional().isIn(['Düşük', 'Normal', 'Yüksek', 'Çok Yüksek']).withMessage('Geçersiz öncelik değeri.'),
    body('status').optional().isIn(['Bekliyor', 'Aktif', 'Tamamlandı', 'Askıya Alındı']).withMessage('Geçersiz durum değeri.')
];

const customerValidation = [
    body('name').trim().notEmpty().withMessage('Müşteri adı zorunludur.'),
    body('surname').trim().notEmpty().withMessage('Müşteri soyadı zorunludur.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Geçerli bir e-posta giriniz.')
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    taskValidation,
    customerValidation
};
