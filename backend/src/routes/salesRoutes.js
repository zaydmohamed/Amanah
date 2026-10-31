const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.post('/', authenticate, logAudit('SALES', 'CREATE_SALE'), salesController.createSale);
router.get('/', authenticate, salesController.getSales);
router.get('/:id', authenticate, salesController.getSaleById);
router.get('/:id/receipt', authenticate, salesController.printReceipt);
router.post('/:id/return', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('SALES', 'RETURN_SALE'), salesController.processReturn);

module.exports = router;

