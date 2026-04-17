const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middleware/auth');

// Tüm profil rotaları authenticateToken gerektirir (ancak router.use ile de yapılabilir)
router.use(authenticateToken);

router.put('/', profileController.updateProfile); // PUT /profile
router.post('/verify-password', profileController.verifyPassword); // POST /profile/verify-password
router.put('/email', profileController.updateEmail); // PUT /profile/email
router.put('/password', profileController.updatePassword); // PUT /profile/password

module.exports = router;
