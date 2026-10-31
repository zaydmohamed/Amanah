const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
const Sale = require('../models/Sale');
const debtService = require('../services/debtService');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, hasDebt } = req.query;
    const filter = {};

    if (hasDebt === 'true') {
      filter.currentBalance = { $gt: 0 };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ name: 1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const salesHistory = await Sale.find({ customer: customer._id }).sort({ saleDate: -1 }).limit(20);
    const paymentHistory = await CustomerPayment.find({ customer: customer._id }).sort({ date: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        customer,
        salesHistory,
        paymentHistory,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, openingBalance, creditLimit, notes } = req.body;

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      openingBalance: Number(openingBalance || 0),
      currentBalance: Number(openingBalance || 0),
      creditLimit: Number(creditLimit || 1000),
      notes,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const result = await debtService.recordCustomerPayment({
      customerId: req.params.id,
      amount,
      paymentMethod,
      reference,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

