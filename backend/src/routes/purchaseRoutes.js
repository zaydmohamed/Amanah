const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('PURCHASES', 'CREATE_PO'), purchaseController.createPurchaseOrder);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), purchaseController.getPurchases);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), purchaseController.getPurchaseById);
router.post('/:id/receive', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('PURCHASES', 'RECEIVE_GOODS'), purchaseController.receiveGoods);
router.post('/:id/return', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('PURCHASES', 'SUPPLIER_RETURN'), purchaseController.returnToSupplier);

module.exports = router;

