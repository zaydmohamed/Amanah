require('dotenv').config();
const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');
const accountingService = require('../backend/src/services/accountingService');
const User = require('../backend/src/models/User');
const Setting = require('../backend/src/models/Setting');

let isInitialized = false;

const initDatabase = async () => {
  if (isInitialized) return;
  
  await connectDB();
  await accountingService.initializeChartOfAccounts();

  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@amanahmart.com',
      password: 'AdminPassword123!',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    });
    console.log('[Vercel] Super Admin user initialized.');
  }

  const settingExists = await Setting.findOne();
  if (!settingExists) {
    await Setting.create({
      businessName: 'Amanah Retail & Wholesale Mart',
      address: 'Main Market Street, Commercial District',
      phone: '+252 61 555 8899',
      email: 'contact@amanahmart.so',
      taxRate: 0.05,
      baseCurrency: 'USD',
      secondaryCurrency: 'SOS',
      exchangeRate: 26000,
      lowStockThreshold: 5,
    });
  }

  isInitialized = true;
};

module.exports = async (req, res) => {
  try {
    // Ensure route prefix matches Express app mounts
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }

    await initDatabase();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Function Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + err.message,
    });
  }
};

