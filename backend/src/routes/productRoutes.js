const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, productController.getProducts);
router.get('/alerts/low-stock', authenticate, productController.getLowStockAlerts);
router.get('/reports/valuation', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), productController.getValuation);
router.get('/movements/history', authenticate, productController.getInventoryMovements);
router.get('/:id/movements', authenticate, productController.getInventoryMovements);
router.get('/categories/all', authenticate, productController.getCategories);
router.post('/categories', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('CATEGORY', 'CREATE'), productController.createCategory);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('PRODUCT', 'CREATE'), productController.createProduct);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('PRODUCT', 'UPDATE'), productController.updateProduct);
router.post('/:id/adjust-stock', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('INVENTORY', 'ADJUST_STOCK'), productController.adjustStock);

module.exports = router;

