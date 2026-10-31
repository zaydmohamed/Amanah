const express = require('express');
const router = express.Router();
const ownerTransactionController = require('../controllers/ownerTransactionController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), ownerTransactionController.getTransactions);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('OWNER_EQUITY', 'RECORD_TRANSACTION'), ownerTransactionController.recordTransaction);

module.exports = router;

