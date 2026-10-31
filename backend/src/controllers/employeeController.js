const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const payrollService = require('../services/payrollService');

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ fullName: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      employeeId,
      ...req.body,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
};

// Attendance
exports.recordAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, overtimeHours, notes } = req.body;
    const targetDate = date ? new Date(new Date(date).setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0));

    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: targetDate },
      {
        employee: employeeId,
        date: targetDate,
        status: status || 'PRESENT',
        checkInTime,
        checkOutTime,
        overtimeHours: Number(overtimeHours || 0),
        notes,
      },
      { upsert: true, new: true }
    ).populate('employee', 'fullName employeeId');

    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const filter = {};

    if (employeeId) filter.employee = employeeId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'fullName employeeId department')
      .sort({ date: -1 });

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (err) {
    next(err);
  }
};

// Payroll
exports.generatePayroll = async (req, res, next) => {
  try {
    const { payrollMonth, employeeId, adjustments } = req.body;
    const payrolls = await payrollService.generateMonthlyPayroll({
      payrollMonth,
      employeeId,
      adjustments,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) {
    next(err);
  }
};

exports.getPayrolls = async (req, res, next) => {
  try {
    const { payrollMonth, status } = req.query;
    const filter = {};

    if (payrollMonth) filter.payrollMonth = payrollMonth;
    if (status) filter.status = status;

    const payrolls = await Payroll.find(filter).populate('employee').sort({ payrollMonth: -1 });
    res.json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) {
    next(err);
  }
};

exports.disburseSalary = async (req, res, next) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const payroll = await payrollService.disburseSalary({
      payrollId: req.params.id,
      amount,
      paymentMethod,
      notes,
      userId: req.user._id,
    });

    res.json({ success: true, data: payroll });
  } catch (err) {
    next(err);
  }
};

