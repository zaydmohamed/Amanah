require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const accountingService = require('./src/services/accountingService');
const User = require('./src/models/User');
const Setting = require('./src/models/Setting');

let isInitialized = false;

const init = async () => {
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

// Ensure database is initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    console.error('[Backend Init Error]:', err);
    res.status(500).json({ success: false, message: 'Database Connection Error: ' + err.message });
  }
});

// If running directly as script (not required as module)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}

module.exports = app;
