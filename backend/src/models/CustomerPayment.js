const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
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
    targetAccount: {
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
    allocatedInvoices: [
      {
        sale: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sale',
        },
        invoiceNumber: String,
        amountAllocated: Number,
      },
    ],
    receivedBy: {
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

customerPaymentSchema.index({ customer: 1, date: -1 });

module.exports = mongoose.model('CustomerPayment', customerPaymentSchema);

