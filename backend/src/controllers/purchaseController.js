const Purchase = require('../models/Purchase');
const purchaseService = require('../services/purchaseService');

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items, additionalCosts, expectedDeliveryDate, notes, paymentMethod, amountPaid } = req.body;

    const purchase = await purchaseService.createPurchaseOrder({
      supplierId,
      items,
      additionalCosts,
      expectedDeliveryDate,
      notes,
      paymentMethod,
      amountPaid,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

exports.getPurchases = async (req, res, next) => {
  try {
    const { supplier, status, paymentStatus } = req.query;
    const filter = {};

    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'name phone')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1 });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    next(err);
  }
};

exports.getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', 'name')
      .populate('journalEntry');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

exports.receiveGoods = async (req, res, next) => {
  try {
    const { receivedItems } = req.body;
    const purchase = await purchaseService.receivePurchase({
      purchaseId: req.params.id,
      receivedItems,
      userId: req.user._id,
    });

    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

exports.returnToSupplier = async (req, res, next) => {
  try {
    const { returnedItems, reason, refundType } = req.body;
    const result = await purchaseService.returnToSupplier({
      purchaseId: req.params.id,
      returnedItems,
      reason,
      refundType,
      userId: req.user._id,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

