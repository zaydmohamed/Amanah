const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const Purchase = require('../models/Purchase');
const debtService = require('../services/debtService');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, hasDebt } = req.query;
    const filter = {};

    if (hasDebt === 'true') {
      filter.currentBalance = { $gt: 0 };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (err) {
    next(err);
  }
};

exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchaseHistory = await Purchase.find({ supplier: supplier._id }).sort({ purchaseDate: -1 }).limit(20);
    const paymentHistory = await SupplierPayment.find({ supplier: supplier._id }).sort({ date: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        supplier,
        purchaseHistory,
        paymentHistory,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, openingBalance, paymentTerms, notes } = req.body;

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      openingBalance: Number(openingBalance || 0),
      currentBalance: Number(openingBalance || 0),
      paymentTerms: paymentTerms || 'Net 30',
      notes,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const result = await debtService.recordSupplierPayment({
      supplierId: req.params.id,
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

