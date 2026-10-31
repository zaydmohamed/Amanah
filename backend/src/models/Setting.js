const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'Amanah Retail & Wholesale Mart',
    },
    address: {
      type: String,
      default: 'Main Market Street, Commercial District',
    },
    phone: {
      type: String,
      default: '+252 61 5000000',
    },
    email: {
      type: String,
      default: 'info@amanahmart.com',
    },
    taxNumber: {
      type: String,
      default: 'TAX-889920',
    },
    taxRate: {
      type: Number,
      default: 0.05, // 5%
    },
    baseCurrency: {
      type: String,
      default: 'USD',
    },
    secondaryCurrency: {
      type: String,
      default: 'SOS',
    },
    exchangeRate: {
      type: Number,
      default: 26000, // 1 USD = 26,000 SOS
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    receiptHeader: {
      type: String,
      default: 'Thank you for shopping with us!',
    },
    receiptFooter: {
      type: String,
      default: 'Goods once sold are returnable within 3 days with receipt.',
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);

