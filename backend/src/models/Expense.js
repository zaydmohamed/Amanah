const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    categoryAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'UNPAID'],
      default: 'CASH',
      required: true,
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    payee: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PAID', 'UNPAID', 'CANCELLED'],
      default: 'PAID',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

expenseSchema.index({ date: -1, categoryAccount: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

