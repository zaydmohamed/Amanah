const CashierShift = require('../models/CashierShift');
const Account = require('../models/Account');
const cashRegisterService = require('../services/cashRegisterService');

exports.getCurrentShift = async (req, res, next) => {
  try {
    const shift = await CashierShift.findOne({
      cashier: req.user._id,
      status: 'OPEN',
    });
    res.json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
};

exports.openShift = async (req, res, next) => {
  try {
    const { openingCash, notes } = req.body;
    const shift = await cashRegisterService.openShift({
      cashierId: req.user._id,
      cashierName: req.user.name,
      openingCash,
      notes,
    });
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
};

exports.closeShift = async (req, res, next) => {
  try {
    const { actualClosingCash, notes } = req.body;
    const shift = await cashRegisterService.closeShift({
      shiftId: req.params.id,
      actualClosingCash,
      notes,
      userId: req.user._id,
    });
    res.json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
};

exports.getShiftsHistory = async (req, res, next) => {
  try {
    const shifts = await CashierShift.find()
      .populate('cashier', 'name username')
      .sort({ startTime: -1 })
      .limit(50);
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (err) {
    next(err);
  }
};

exports.getLiquidAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({
      code: { $in: ['1010', '1020', '1030'] },
      isActive: true,
    });
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
};

exports.transferFunds = async (req, res, next) => {
  try {
    const { sourceAccountCode, targetAccountCode, amount, reason } = req.body;
    const result = await cashRegisterService.transferFunds({
      sourceAccountCode,
      targetAccountCode,
      amount,
      reason,
      userId: req.user._id,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

