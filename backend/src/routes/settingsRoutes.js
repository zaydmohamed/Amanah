const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.get('/', authenticate, dashboardController.getSettings);
router.put('/', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('SETTINGS', 'UPDATE'), dashboardController.updateSettings);
router.post('/reset-database', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('SETTINGS', 'RESET_DATABASE'), dashboardController.resetDatabase);

module.exports = router;

