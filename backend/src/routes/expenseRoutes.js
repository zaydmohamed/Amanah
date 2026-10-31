const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), expenseController.getExpenses);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), logAudit('EXPENSE', 'CREATE'), expenseController.createExpense);
router.post('/:id/pay', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), logAudit('EXPENSE', 'PAY_UNPAID'), expenseController.payUnpaidExpense);

module.exports = router;

