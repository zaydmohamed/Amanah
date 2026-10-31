const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'],
      default: 'CASH',
      required: true,
    },
    sourceAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    reference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    allocatedPurchases: [
      {
        purchase: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Purchase',
        },
        purchaseNumber: String,
        amountAllocated: Number,
      },
    ],
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

supplierPaymentSchema.index({ supplier: 1, date: -1 });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);

