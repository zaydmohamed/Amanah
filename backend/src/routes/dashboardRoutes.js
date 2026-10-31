const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/metrics', authenticate, dashboardController.getDashboardMetrics);
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN', 'OWNER'), dashboardController.getAuditLogs);

module.exports = router;

