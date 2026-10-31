const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    additionalCosts: {
      type: Number,
      default: 0,
    },
    totalAmount: {
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
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
    },
    status: {
      type: String,
      enum: ['ORDERED', 'RECEIVED', 'CANCELLED'],
      default: 'ORDERED',
    },
    receivedDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT'],
      default: 'CREDIT',
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
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

purchaseSchema.index({ purchaseNumber: 1, purchaseDate: -1, supplier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);

