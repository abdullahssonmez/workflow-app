const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.post('/chat/upload', upload.array('files'), chatController.uploadFile);
router.get('/messages/:contextType/:contextId', chatController.getMessages);
router.delete('/messages/:contextType/:contextId', chatController.deleteMessages);

router.get('/groups', chatController.getGroups);
router.post('/groups', chatController.createGroup);
router.delete('/groups/:id', chatController.deleteGroup);

module.exports = router;
