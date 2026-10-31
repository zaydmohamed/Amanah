const Sale = require('../models/Sale');
const Setting = require('../models/Setting');
const salesService = require('../services/salesService');
const reportingService = require('../services/reportingService');

exports.createSale = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discountTotal,
      taxRate,
      paymentMethod,
      payments,
      notes,
    } = req.body;

    const sale = await salesService.createSale({
      customerId,
      customerName,
      customerPhone,
      cashierId: req.user._id,
      cashierName: req.user.name,
      items,
      discountTotal,
      taxRate,
      paymentMethod,
      payments,
      notes,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, cashier, customer, paymentStatus, search } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (cashier) filter.cashier = cashier;
    if (customer) filter.customer = customer;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const sales = await Sale.find(filter).sort({ saleDate: -1 }).limit(100);
    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) {
    next(err);
  }
};

exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name username')
      .populate('customer')
      .populate('items.product');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
};

exports.printReceipt = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    let setting = await Setting.findOne();
    if (!setting) {
      setting = { businessName: 'Amanah Retail Mart', address: 'Commercial District', phone: '+252 61 5000000' };
    }

    const pdfBuffer = await reportingService.generateReceiptPDF(sale, setting);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Receipt-${sale.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.processReturn = async (req, res, next) => {
  try {
    const { returnedItems, refundMethod, reason } = req.body;
    const result = await salesService.processReturn({
      saleId: req.params.id,
      returnedItems,
      refundMethod,
      reason,
      userId: req.user._id,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

