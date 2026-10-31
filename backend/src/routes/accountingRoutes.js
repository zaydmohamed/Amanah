const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/accounts', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getAccounts);
router.get('/journal-entries', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getJournalEntries);
router.get('/trial-balance', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getTrialBalance);
router.get('/general-ledger/:accountCode', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getGeneralLedger);
router.get('/profit-and-loss', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getProfitAndLoss);
router.get('/balance-sheet', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getBalanceSheet);
router.get('/cash-flow', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), accountingController.getCashFlowStatement);
router.post('/manual-journal-entry', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), logAudit('ACCOUNTING', 'MANUAL_ENTRY'), accountingController.createManualJournalEntry);

module.exports = router;

