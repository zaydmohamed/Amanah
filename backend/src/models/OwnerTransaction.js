const mongoose = require('mongoose');

const ownerTransactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['DRAWING', 'CAPITAL_CONTRIBUTION'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    recordedBy: {
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

module.exports = mongoose.model('OwnerTransaction', ownerTransactionSchema);

