const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    purchaseCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
    location: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);

