require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const accountingService = require('./services/accountingService');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Setting = require('./models/Setting');
const Employee = require('./models/Employee');
const salesService = require('./services/salesService');
const purchaseService = require('./services/purchaseService');
const expenseService = require('./services/expenseService');
const ownerTransactionService = require('./services/ownerTransactionService');
const payrollService = require('./services/payrollService');

const PORT = process.env.PORT || 5000;

const seedInitialDataIfEmpty = async () => {
  const adminExists = await User.findOne({ username: 'admin' });
  if (adminExists) return;

  console.log('[Auto-Bootstrap] Database is empty. Seeding initial retail catalog & demo users...');
  
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

  await ownerTransactionService.recordTransaction({
    type: 'CAPITAL_CONTRIBUTION',
    amount: 15000,
    reason: 'Initial business seed capital injection into cash & bank',
    userId: superAdmin._id,
  });

  const catBeverages = await Category.create({ name: 'Beverages', code: 'BEV', description: 'Juices, water, and sodas' });
  const catGroceries = await Category.create({ name: 'Groceries & Grains', code: 'GRO', description: 'Rice, flour, sugar, oil' });
  const catDairy = await Category.create({ name: 'Dairy & Eggs', code: 'DAI', description: 'Milk, cheese, yogurt' });
  const catSnacks = await Category.create({ name: 'Snacks & Confectionery', code: 'SNK', description: 'Biscuits, chips, chocolates' });

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

  const po1 = await purchaseService.createPurchaseOrder({
    supplierId: supplierOasis._id,
    items: [
      { productId: pRice._id, orderedQuantity: 50, unitCost: 22.0 },
      { productId: pOil._id, orderedQuantity: 40, unitCost: 8.5 },
    ],
    paymentMethod: 'CREDIT',
    amountPaid: 500,
    createdBy: manager._id,
    notes: 'Initial grain & oil delivery',
  });
  await purchaseService.receivePurchase({ purchaseId: po1._id, userId: manager._id });

  const po2 = await purchaseService.createPurchaseOrder({
    supplierId: supplierSomDairy._id,
    items: [
      { productId: pMilk._id, orderedQuantity: 60, unitCost: 6.2 },
      { productId: pJuice._id, orderedQuantity: 100, unitCost: 1.1 },
      { productId: pBiscuits._id, orderedQuantity: 80, unitCost: 1.4 },
    ],
    paymentMethod: 'CASH',
    amountPaid: 594,
    createdBy: manager._id,
  });
  await purchaseService.receivePurchase({ purchaseId: po2._id, userId: manager._id });

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

  await salesService.createSale({
    customerId: custKhadar._id,
    cashierId: cashier._id,
    cashierName: cashier.name,
    items: [
      { productId: pRice._id, quantity: 10, unitPrice: 28.5 },
      { productId: pOil._id, quantity: 5, unitPrice: 11.5 },
    ],
    paymentMethod: 'CREDIT',
    notes: 'Monthly bulk pantry order',
  });

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

  const emp1 = await Employee.create({
    employeeId: 'EMP-0001',
    fullName: 'Sahra Ismail',
    phone: '+252 61 888 1234',
    jobTitle: 'Senior POS Cashier',
    department: 'Retail Sales',
    salaryType: 'MONTHLY',
    baseSalary: 350,
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const payrolls = await payrollService.generateMonthlyPayroll({
    payrollMonth: currentMonth,
    userId: accountant._id,
  });

  if (payrolls.length > 0) {
    await payrollService.disburseSalary({
      payrollId: payrolls[0]._id,
      amount: payrolls[0].netSalary,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Monthly bank salary transfer',
      userId: accountant._id,
    });
  }

  await ownerTransactionService.recordTransaction({
    type: 'DRAWING',
    amount: 200,
    reason: 'Personal family living allowance withdrawal',
    userId: superAdmin._id,
  });

  console.log('[Auto-Bootstrap] Initial seed completed successfully!');
};

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
        email: 'admin@shop.com',
        password: 'AdminPassword123!',
        role: 'SUPER_ADMIN',
        permissions: ['*'],
      });
      console.log('[Auth] Default Super Admin created: admin / AdminPassword123!');
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Retail Shop Management & Accounting System Started!`);
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

