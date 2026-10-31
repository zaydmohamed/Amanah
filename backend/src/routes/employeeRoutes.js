const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Employees
router.get('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'), employeeController.getEmployees);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('EMPLOYEE', 'CREATE'), employeeController.createEmployee);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER'), logAudit('EMPLOYEE', 'UPDATE'), employeeController.updateEmployee);

// Attendance
router.post('/attendance', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), logAudit('ATTENDANCE', 'RECORD'), employeeController.recordAttendance);
router.get('/attendance', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'MANAGER'), employeeController.getAttendance);

// Payroll
router.get('/payrolls', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), employeeController.getPayrolls);
router.post('/payrolls/generate', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), logAudit('PAYROLL', 'GENERATE'), employeeController.generatePayroll);
router.post('/payrolls/:id/disburse', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'), logAudit('PAYROLL', 'DISBURSE'), employeeController.disburseSalary);

module.exports = router;

