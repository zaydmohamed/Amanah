const OwnerTransaction = require('../models/OwnerTransaction');
const ownerTransactionService = require('../services/ownerTransactionService');

exports.getTransactions = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const transactions = await OwnerTransaction.find(filter)
      .populate('paymentAccount', 'name code')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    next(err);
  }
};

exports.recordTransaction = async (req, res, next) => {
  try {
    const { type, amount, paymentAccountId, reason, notes } = req.body;

    const transaction = await ownerTransactionService.recordTransaction({
      type,
      amount,
      paymentAccountId,
      reason,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

