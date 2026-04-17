const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerValidation, loginValidation } = require('../middleware/validation');

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
