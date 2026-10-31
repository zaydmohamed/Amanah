const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be positive'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  historicalCost: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  totalCostOfGoodsSold: {
    type: Number,
    required: true,
  },
});

const paymentDetailSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  reference: {
    type: String,
    default: '',
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashierName: {
      type: String,
      required: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    items: [saleItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalCostOfGoodsSold: {
      type: Number,
      required: true,
      default: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      required: true,
      default: 'PAID',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT', 'SPLIT'],
      default: 'CASH',
    },
    payments: [paymentDetailSchema],
    status: {
      type: String,
      enum: ['COMPLETED', 'RETURNED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashierShift',
    },
    journalEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
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

saleSchema.index({ invoiceNumber: 1, saleDate: -1, cashier: 1, customer: 1 });

module.exports = mongoose.model('Sale', saleSchema);

