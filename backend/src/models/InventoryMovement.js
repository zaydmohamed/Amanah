const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      required: true,
      enum: [
        'PURCHASE_RECEIVE',
        'SALE',
        'CUSTOMER_RETURN',
        'SUPPLIER_RETURN',
        'STOCK_ADJUSTMENT',
        'DAMAGED_WRITE_OFF',
        'OPENING_STOCK',
      ],
      index: true,
    },
    quantityIn: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    resultingStock: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      default: '',
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed,
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryMovementSchema.index({ product: 1, date: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);

