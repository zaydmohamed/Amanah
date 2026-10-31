require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const accountingService = require('./services/accountingService');
const User = require('./models/User');
const Setting = require('./models/Setting');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await accountingService.initializeChartOfAccounts();
    console.log('[Accounting Engine] Chart of Accounts verified and ready.');

    // Ensure default admin user exists if no users
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
      console.log('[Auth] Default Super Admin created: admin / AdminPassword123!');
    }

    // Ensure default settings exist
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

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Amanah Retail Shop Management System Started!`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
