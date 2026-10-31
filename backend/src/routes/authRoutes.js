const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/register', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('AUTH', 'CREATE_USER'), authController.registerUser);
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'OWNER'), authController.getUsers);

module.exports = router;

