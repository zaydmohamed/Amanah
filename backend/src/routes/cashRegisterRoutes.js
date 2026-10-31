const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/current-shift', authenticate, cashRegisterController.getCurrentShift);
router.post('/open-shift', authenticate, logAudit('SHIFT', 'OPEN'), cashRegisterController.openShift);
router.post('/close-shift/:id', authenticate, logAudit('SHIFT', 'CLOSE'), cashRegisterController.closeShift);
router.get('/shifts-history', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), cashRegisterController.getShiftsHistory);
router.get('/accounts', authenticate, cashRegisterController.getLiquidAccounts);
router.post('/transfer-funds', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), logAudit('CASH', 'TRANSFER_FUNDS'), cashRegisterController.transferFunds);

module.exports = router;

