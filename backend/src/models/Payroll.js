const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    payrollMonth: {
      type: String, // YYYY-MM
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACCRUED', 'PARTIALLY_PAID', 'PAID'],
      default: 'ACCRUED',
    },
    accrualJournalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    paymentJournalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'],
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
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

payrollSchema.index({ payrollMonth: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);

