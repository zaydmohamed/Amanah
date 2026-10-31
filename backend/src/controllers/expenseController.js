const Expense = require('../models/Expense');
const expenseService = require('../services/expenseService');

exports.getExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category, status } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (category) filter.categoryAccount = category;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .populate('categoryAccount', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { categoryAccountId, description, amount, paymentMethod, payee, receiptUrl, notes } = req.body;

    const expense = await expenseService.recordExpense({
      categoryAccountId,
      description,
      amount,
      paymentMethod,
      payee,
      receiptUrl,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

exports.payUnpaidExpense = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const expense = await expenseService.payUnpaidExpense({
      expenseId: req.params.id,
      paymentMethod,
      userId: req.user._id,
    });

    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

