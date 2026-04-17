const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', teamController.getTeam);
router.post('/invite', teamController.inviteMember);
router.post('/invite/respond', teamController.respondToInvite);
router.delete('/:id', teamController.deleteMember);

module.exports = router;
