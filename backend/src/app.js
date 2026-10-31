const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/db');
const accountingService = require('./services/accountingService');
const User = require('./models/User');
const Setting = require('./models/Setting');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ownerTransactionRoutes = require('./routes/ownerTransactionRoutes');
const cashRegisterRoutes = require('./routes/cashRegisterRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

app.use('/api/auth/login', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Enterprise Shop Management & Accounting System',
    timestamp: new Date(),
  });
});

// Singleton initialization promise for database & default seeds
let initPromise = null;

const ensureDatabaseInitialized = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
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
      console.log('[Auth] Default Super Admin created: admin');
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
  })();

  return initPromise;
};

// Auto-connect database before processing any API route
app.use(async (req, res, next) => {
  // Only intercept API calls
  if (!req.path.startsWith('/api') && req.path !== '/') {
    return next();
  }

  try {
    await ensureDatabaseInitialized();
    next();
  } catch (err) {
    console.error('[Database Middleware Error]:', err.message);
    initPromise = null; // Allow retry on subsequent requests
    return res.status(500).json({
      success: false,
      message: `Database connection failed (${err.message}). Fadlan hubi MONGODB_URI iyo in 0.0.0.0/0 (Network Access) MongoDB Atlas looga ogolaaday.`,
    });
  }
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/owner-transactions', ownerTransactionRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
