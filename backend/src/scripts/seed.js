require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Employee = require('../models/Employee');
const Setting = require('../models/Setting');
const accountingService = require('../services/accountingService');
const salesService = require('../services/salesService');
const purchaseService = require('../services/purchaseService');
const expenseService = require('../services/expenseService');
const ownerTransactionService = require('../services/ownerTransactionService');
const payrollService = require('../services/payrollService');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing previous data...');
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    console.log('[Seed] Initializing Chart of Accounts...');
    await accountingService.initializeChartOfAccounts();

    console.log('[Seed] Creating Store Settings...');
    await Setting.create({
      businessName: 'Amanah Retail & Wholesale Mart',
      address: 'Main Market Street, Commercial District',
      phone: '+252 61 555 8899',
      email: 'contact@amanahmart.so',
      taxNumber: 'SOM-TAX-998811',
      taxRate: 0.05,
      baseCurrency: 'USD',
      secondaryCurrency: 'SOS',
      exchangeRate: 26000,
      lowStockThreshold: 5,
    });

    console.log('[Seed] Creating Users with RBAC Roles...');
    const superAdmin = await User.create({
      name: 'Abdi Hassan (Super Admin)',
      username: 'admin',
      email: 'admin@amanahmart.com',
      password: 'AdminPassword123!',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    });

    const manager = await User.create({
      name: 'Farhan Ali (Store Manager)',
      username: 'manager',
      email: 'manager@amanahmart.com',
      password: 'ManagerPassword123!',
      role: 'MANAGER',
      permissions: ['INVENTORY_MANAGE', 'SALES_MANAGE', 'PURCHASES_MANAGE'],
    });

    const cashier = await User.create({
      name: 'Fatima Omar (Lead Cashier)',
      username: 'cashier',
      email: 'cashier@amanahmart.com',
      password: 'CashierPassword123!',
      role: 'CASHIER',
      permissions: ['POS_CHECKOUT', 'RECEIPT_PRINT'],
    });

    const accountant = await User.create({
      name: 'Mohamed Warsame (Accountant)',
      username: 'accountant',
      email: 'accountant@amanahmart.com',
      password: 'AccountantPassword123!',
      role: 'ACCOUNTANT',
      permissions: ['ACCOUNTING_VIEW', 'FINANCIAL_STATEMENTS', 'PAYROLL_MANAGE'],
    });

    console.log('[Seed] Recording Owner Initial Capital...');
    await ownerTransactionService.recordTransaction({
      type: 'CAPITAL_CONTRIBUTION',
      amount: 15000,
      reason: 'Initial business seed capital injection into cash & bank',
      userId: superAdmin._id,
    });

    console.log('[Seed] Creating Product Categories...');
    const catBeverages = await Category.create({ name: 'Beverages', code: 'BEV', description: 'Juices, water, and sodas' });
    const catGroceries = await Category.create({ name: 'Groceries & Grains', code: 'GRO', description: 'Rice, flour, sugar, oil' });
    const catDairy = await Category.create({ name: 'Dairy & Eggs', code: 'DAI', description: 'Milk, cheese, yogurt' });
    const catSnacks = await Category.create({ name: 'Snacks & Confectionery', code: 'SNK', description: 'Biscuits, chips, chocolates' });

    console.log('[Seed] Creating Suppliers...');
    const supplierOasis = await Supplier.create({
      name: 'Oasis Wholesale Foods Ltd',
      contactPerson: 'Yusuf Barre',
      phone: '+252 61 777 0011',
      email: 'sales@oasiswholesale.com',
      address: 'Port Warehouse 4B',
      paymentTerms: 'Net 30',
    });

    const supplierSomDairy = await Supplier.create({
      name: 'Somali Fresh Dairy Co.',
      contactPerson: 'Halima Nur',
      phone: '+252 61 777 0022',
      email: 'orders@somdairy.com',
      address: 'Industrial Zone Rd 2',
      paymentTerms: 'Net 15',
    });

    console.log('[Seed] Creating Products...');
    const pRice = await Product.create({
      name: 'Basmati Rice Premium 25kg',
      sku: 'RIC-BAS-25KG',
      barcode: '8901234567890',
      category: catGroceries._id,
      unit: 'bag',
      purchaseCost: 22.0,
      sellingPrice: 28.5,
      currentStock: 0,
      minStockLevel: 10,
    });

    const pOil = await Product.create({
      name: 'Pure Sunflower Cooking Oil 5L',
      sku: 'OIL-SUN-5L',
      barcode: '8901234567891',
      category: catGroceries._id,
      unit: 'bottle',
      purchaseCost: 8.5,
      sellingPrice: 11.5,
      currentStock: 0,
      minStockLevel: 8,
    });

    const pMilk = await Product.create({
      name: 'Full Cream Milk Powder 900g',
      sku: 'MLK-POW-900G',
      barcode: '8901234567892',
      category: catDairy._id,
      unit: 'tin',
      purchaseCost: 6.2,
      sellingPrice: 8.5,
      currentStock: 0,
      minStockLevel: 15,
    });

    const pJuice = await Product.create({
      name: 'Mango & Orange Nectar 1L',
      sku: 'JUC-MNG-1L',
      barcode: '8901234567893',
      category: catBeverages._id,
      unit: 'box',
      purchaseCost: 1.1,
      sellingPrice: 1.8,
      currentStock: 0,
      minStockLevel: 20,
    });

    const pBiscuits = await Product.create({
      name: 'Digestive Wheat Biscuits 400g',
      sku: 'SNK-DIG-400G',
      barcode: '8901234567894',
      category: catSnacks._id,
      unit: 'pack',
      purchaseCost: 1.4,
      sellingPrice: 2.2,
      currentStock: 0,
      minStockLevel: 12,
    });

    console.log('[Seed] Creating and Receiving Purchase Orders...');
    const po1 = await purchaseService.createPurchaseOrder({
      supplierId: supplierOasis._id,
      items: [
        { productId: pRice._id, orderedQuantity: 50, unitCost: 22.0 },
        { productId: pOil._id, orderedQuantity: 40, unitCost: 8.5 },
      ],
      paymentMethod: 'CREDIT',
      amountPaid: 500, // $500 upfront deposit, remaining on credit
      createdBy: manager._id,
      notes: 'Initial grain & oil container delivery',
    });

    // Receive goods into inventory
    await purchaseService.receivePurchase({
      purchaseId: po1._id,
      userId: manager._id,
    });

    const po2 = await purchaseService.createPurchaseOrder({
      supplierId: supplierSomDairy._id,
      items: [
        { productId: pMilk._id, orderedQuantity: 60, unitCost: 6.2 },
        { productId: pJuice._id, orderedQuantity: 100, unitCost: 1.1 },
        { productId: pBiscuits._id, orderedQuantity: 80, unitCost: 1.4 },
      ],
      paymentMethod: 'CASH',
      amountPaid: 594, // Fully paid cash purchase
      createdBy: manager._id,
      notes: 'Weekly fresh beverages and dairy batch',
    });

    await purchaseService.receivePurchase({
      purchaseId: po2._id,
      userId: manager._id,
    });

    console.log('[Seed] Creating Registered Customers...');
    const custKhadar = await Customer.create({
      name: 'Khadar Guled (Supermarket Retailer)',
      phone: '+252 61 999 1122',
      email: 'khadar.guled@gmail.com',
      address: 'Waberi District, House 14',
      creditLimit: 1500,
      openingBalance: 0,
    });

    const custAsha = await Customer.create({
      name: 'Asha Dahir (Cafeteria Owner)',
      phone: '+252 61 999 3344',
      email: 'asha.dahir@yahoo.com',
      address: 'Hodan District, KM4',
      creditLimit: 800,
      openingBalance: 0,
    });

    console.log('[Seed] Processing Realistic Sales...');
    // 1. Cash POS Sale
    await salesService.createSale({
      customerName: 'Walk-in Customer',
      cashierId: cashier._id,
      cashierName: cashier.name,
      items: [
        { productId: pMilk._id, quantity: 2 },
        { productId: pBiscuits._id, quantity: 3 },
      ],
      paymentMethod: 'CASH',
      payments: [{ method: 'CASH', amount: 23.6 }],
    });

    // 2. Credit Sale to registered customer
    await salesService.createSale({
      customerId: custKhadar._id,
      cashierId: cashier._id,
      cashierName: cashier.name,
      items: [
        { productId: pRice._id, quantity: 10, unitPrice: 28.5 },
        { productId: pOil._id, quantity: 5, unitPrice: 11.5 },
      ],
      paymentMethod: 'CREDIT',
      notes: 'Monthly bulk pantry order on 15-day credit',
    });

    // 3. Split Payment Sale (Cash + Mobile Money)
    await salesService.createSale({
      customerId: custAsha._id,
      cashierId: cashier._id,
      cashierName: cashier.name,
      items: [
        { productId: pJuice._id, quantity: 20, unitPrice: 1.8 },
        { productId: pMilk._id, quantity: 4, unitPrice: 8.5 },
      ],
      paymentMethod: 'SPLIT',
      payments: [
        { method: 'CASH', amount: 30.0 },
        { method: 'MOBILE_MONEY', amount: 40.0 },
      ],
      notes: 'Beverage supply for weekend events',
    });

    console.log('[Seed] Recording Operating Expenses...');
    const rentAccount = await accountingService.getAccountByCode('6010');
    const utilityAccount = await accountingService.getAccountByCode('6030');

    await expenseService.recordExpense({
      categoryAccountId: rentAccount._id,
      description: 'Store Premises Monthly Lease',
      amount: 450,
      paymentMethod: 'BANK_TRANSFER',
      payee: 'Hodan Commercial Properties LLC',
      userId: accountant._id,
    });

    await expenseService.recordExpense({
      categoryAccountId: utilityAccount._id,
      description: 'Electricity Generator Supply Bill',
      amount: 95,
      paymentMethod: 'CASH',
      payee: 'Mogadishu Power Co.',
      userId: accountant._id,
    });

    console.log('[Seed] Creating Employees & Processing Monthly Payroll...');
    const emp1 = await Employee.create({
      employeeId: 'EMP-0001',
      fullName: 'Sahra Ismail',
      phone: '+252 61 888 1234',
      jobTitle: 'Senior POS Cashier',
      department: 'Retail Sales',
      salaryType: 'MONTHLY',
      baseSalary: 350,
    });

    const emp2 = await Employee.create({
      employeeId: 'EMP-0002',
      fullName: 'Hussein Jama',
      phone: '+252 61 888 5678',
      jobTitle: 'Inventory Stock Controller',
      department: 'Warehouse',
      salaryType: 'MONTHLY',
      baseSalary: 400,
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const payrolls = await payrollService.generateMonthlyPayroll({
      payrollMonth: currentMonth,
      userId: accountant._id,
    });

    // Disburse one employee salary to demonstrate paid vs accrued liabilities
    if (payrolls.length > 0) {
      await payrollService.disburseSalary({
        payrollId: payrolls[0]._id,
        amount: payrolls[0].netSalary,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Monthly bank salary transfer',
        userId: accountant._id,
      });
    }

    console.log('[Seed] Recording Owner Withdrawal...');
    await ownerTransactionService.recordTransaction({
      type: 'DRAWING',
      amount: 200,
      reason: 'Personal family living allowance withdrawal',
      userId: superAdmin._id,
    });

    console.log('[Seed] Verifying Double-Entry Trial Balance...');
    const tb = await accountingService.getTrialBalance();
    console.log(`[Seed] Trial Balance Result: Total Debits: $${tb.totalDebit} | Total Credits: $${tb.totalCredit} | Balanced: ${tb.isBalanced}`);

    console.log('================================================================');
    console.log('✅ DATABASE SUCCESSFULLY SEEDED WITH REALISTIC RETAIL DATA!');
    console.log('================================================================');
    console.log('Demo Credentials:');
    console.log('  👑 Super Admin : username: admin      / password: AdminPassword123!');
    console.log('  🏢 Manager     : username: manager    / password: ManagerPassword123!');
    console.log('  🛒 Cashier     : username: cashier    / password: CashierPassword123!');
    console.log('  📊 Accountant  : username: accountant / password: AccountantPassword123!');
    console.log('================================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();

