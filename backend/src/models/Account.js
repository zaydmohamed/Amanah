const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Account code is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'COGS', 'EXPENSE'],
    },
    subType: {
      type: String,
      default: 'GENERAL',
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isSystemAccount: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ code: 1, type: 1 });

module.exports = mongoose.model('Account', accountSchema);

