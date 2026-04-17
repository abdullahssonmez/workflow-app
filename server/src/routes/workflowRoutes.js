const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Workflows
router.get('/workflows', workflowController.getWorkflows);
router.post('/workflows', workflowController.createWorkflow);
router.delete('/workflows/:id', workflowController.deleteWorkflow);
router.put('/workflows/:id', workflowController.updateWorkflow);

// Stages
router.post('/stages', workflowController.createStage);
router.put('/stages/:id', workflowController.updateStage);
router.delete('/stages/:id', workflowController.deleteStage);

// Assignees
router.post('/workflows/:id/assignees', workflowController.assignUser);
router.delete('/workflows/:id/assignees/:userId', workflowController.removeUniqueUser);

module.exports = router;
