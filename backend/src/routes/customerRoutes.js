const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, customerController.getCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, logAudit('CUSTOMER', 'CREATE'), customerController.createCustomer);
router.put('/:id', authenticate, logAudit('CUSTOMER', 'UPDATE'), customerController.updateCustomer);
router.post('/:id/payments', authenticate, logAudit('CUSTOMER_PAYMENT', 'RECORD_PAYMENT'), customerController.recordPayment);

module.exports = router;

