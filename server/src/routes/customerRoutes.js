const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { validate, customerValidation } = require('../middleware/validation');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', customerController.getCustomers);
router.post('/', customerValidation, validate, customerController.createCustomer);
router.put('/:id', customerValidation, validate, customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
