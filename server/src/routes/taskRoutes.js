const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, taskValidation } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/', upload.array('files'), taskValidation, validate, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', upload.array('files'), taskValidation, validate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/:id/activities', taskController.getTaskActivities);
router.post('/:id/comments', taskController.addTaskComment);

module.exports = router;
