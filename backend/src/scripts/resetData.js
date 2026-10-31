require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

// Import all models
const User = require('../models/User');
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryMovement = require('../models/InventoryMovement');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Expense = require('../models/Expense');
const OwnerTransaction = require('../models/OwnerTransaction');
const CashierShift = require('../models/CashierShift');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const accountingService = require('../services/accountingService');

const clearAllData = async () => {
  try {
    console.log('[Reset] Connecting to database...');
    await connectDB();

    console.log('[Reset] Deleting operational and transactional data...');
    await Promise.all([
      Sale.deleteMany({}),
      Purchase.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      InventoryMovement.deleteMany({}),
      Customer.deleteMany({}),
      CustomerPayment.deleteMany({}),
      Supplier.deleteMany({}),
      SupplierPayment.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      Payroll.deleteMany({}),
      Expense.deleteMany({}),
      OwnerTransaction.deleteMany({}),
      CashierShift.deleteMany({}),
      AuditLog.deleteMany({}),
      JournalEntry.deleteMany({}),
    ]);

    console.log('[Reset] Resetting Chart of Accounts balances to 0...');
    await Account.updateMany({}, { $set: { balance: 0 } });

    // Verify default Chart of Accounts exists
    await accountingService.initializeChartOfAccounts();

    console.log('[Reset] Ensuring Super Admin account is available...');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        username: 'admin',
        email: 'admin@shop.com',
        password: 'AdminPassword123!',
        role: 'SUPER_ADMIN',
        permissions: ['*'],
      });
    }

    // Keep clean settings
    const settingExists = await Setting.findOne();
    if (!settingExists) {
      await Setting.create({
        businessName: 'My Retail Mart',
        address: 'Main Street',
        phone: '+252 61 000 0000',
        baseCurrency: 'USD',
        secondaryCurrency: 'SOS',
        exchangeRate: 26000,
        taxRate: 0.05,
      });
    }

    console.log('====================================================');
    console.log('✅ XOGTA DHAN WAA LA TIRTIRAY! (ALL DATA CLEARED)');
    console.log('====================================================');
    console.log('Database is completely fresh and clean.');
    console.log('Chart of Accounts balances: $0.00');
    console.log('Super Admin login:');
    console.log('  Username: admin');
    console.log('  Password: AdminPassword123!');
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Reset Error]:', err);
    await disconnectDB();
    process.exit(1);
  }
};

clearAllData();

