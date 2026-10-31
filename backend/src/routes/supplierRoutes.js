const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), supplierController.getSuppliers);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), supplierController.getSupplierById);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('SUPPLIER', 'CREATE'), supplierController.createSupplier);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('SUPPLIER', 'UPDATE'), supplierController.updateSupplier);
router.post('/:id/payments', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), logAudit('SUPPLIER_PAYMENT', 'RECORD_PAYMENT'), supplierController.recordPayment);

module.exports = router;

