const mongoose = require('mongoose');

const journalEntryLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  accountCode: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  debit: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  credit: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  description: {
    type: String,
    default: '',
  },
});

const journalEntrySchema = new mongoose.Schema(
  {
    entryNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reference: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    sourceModule: {
      type: String,
      enum: [
        'SALES',
        'SALES_RETURN',
        'PURCHASES',
        'SUPPLIER_RETURN',
        'CUSTOMER_PAYMENT',
        'SUPPLIER_PAYMENT',
        'PAYROLL_ACCRUAL',
        'PAYROLL_PAYMENT',
        'EXPENSE',
        'OWNER_DRAWING',
        'OWNER_CAPITAL',
        'INTERNAL_TRANSFER',
        'INVENTORY_ADJUSTMENT',
        'MANUAL',
      ],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.Mixed,
    },
    lines: [journalEntryLineSchema],
    totalDebit: {
      type: Number,
      required: true,
    },
    totalCredit: {
      type: Number,
      required: true,
    },
    isBalanced: {
      type: Boolean,
      default: true,
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedByEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

journalEntrySchema.pre('validate', function (next) {
  if (this.lines && this.lines.length > 0) {
    const totalDebit = this.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = this.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    
    // Round to 2 decimal places to prevent floating point issues
    this.totalDebit = Math.round(totalDebit * 100) / 100;
    this.totalCredit = Math.round(totalCredit * 100) / 100;
    
    if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
      return next(new Error(`Unbalanced Journal Entry: Debits (${this.totalDebit}) do not equal Credits (${this.totalCredit})`));
    }
    this.isBalanced = true;
  }
  next();
});

journalEntrySchema.index({ entryNumber: 1, date: -1, sourceModule: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);

