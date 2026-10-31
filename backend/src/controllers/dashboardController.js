const dashboardService = require('../services/dashboardService');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');

exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardMetrics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module: moduleName, action, limit = 50 } = req.query;
    const filter = {};
    if (moduleName) filter.module = moduleName;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name username role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryMovement = require('../models/InventoryMovement');
const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Expense = require('../models/Expense');
const OwnerTransaction = require('../models/OwnerTransaction');
const CashierShift = require('../models/CashierShift');
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');

exports.resetDatabase = async (req, res, next) => {
  try {
    await Promise.all([
      Sale.deleteMany({}),
      Purchase.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      InventoryMovement.deleteMany({}),
      Customer.deleteMany({}),
      CustomerPayment.deleteMany({}),
      Supplier.deleteMany({}),
      SupplierPayment.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      Payroll.deleteMany({}),
      Expense.deleteMany({}),
      OwnerTransaction.deleteMany({}),
      CashierShift.deleteMany({}),
      JournalEntry.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    await Account.updateMany({}, { $set: { balance: 0 } });

    res.json({
      success: true,
      message: 'Xogta oo dhan si guul leh ayaa loo tirtiray! All data has been completely cleared.',
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      Object.assign(setting, req.body);
      await setting.save();
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

