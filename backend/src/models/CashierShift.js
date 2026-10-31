const mongoose = require('mongoose');

const cashierShiftSchema = new mongoose.Schema(
  {
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashierName: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
    },
    openingCash: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalCashSales: {
      type: Number,
      default: 0,
    },
    totalDebtCollections: {
      type: Number,
      default: 0,
    },
    totalCashPayouts: {
      type: Number,
      default: 0,
    },
    expectedClosingCash: {
      type: Number,
      default: 0,
    },
    actualClosingCash: {
      type: Number,
    },
    shortageOrOverage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

cashierShiftSchema.index({ cashier: 1, status: 1, startTime: -1 });

module.exports = mongoose.model('CashierShift', cashierShiftSchema);

