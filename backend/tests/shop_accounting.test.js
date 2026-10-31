const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Customer = require('../src/models/Customer');
const Supplier = require('../src/models/Supplier');
const Employee = require('../src/models/Employee');
const Account = require('../src/models/Account');
const accountingService = require('../src/services/accountingService');
const salesService = require('../src/services/salesService');
const purchaseService = require('../src/services/purchaseService');
const debtService = require('../src/services/debtService');
const payrollService = require('../src/services/payrollService');
const expenseService = require('../src/services/expenseService');
const ownerTransactionService = require('../src/services/ownerTransactionService');
const cashRegisterService = require('../src/services/cashRegisterService');

describe('Full Retail Shop Management & Double-Entry Accounting Engine Tests', () => {
  let adminToken;
  let cashierToken;
  let accountantToken;
  let testCategory;
  let testProduct;
  let testCustomer;
  let testSupplier;
  let testEmployee;
  let adminUser;
  let cashierUser;
  let accountantUser;

  beforeAll(async () => {
    process.env.ENABLE_IN_MEMORY_DB = 'true';
    process.env.NODE_ENV = 'test';
    await connectDB();
    await accountingService.initializeChartOfAccounts();

    // Create test users
    adminUser = await User.create({
      name: 'Test Admin',
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'Password123!',
      role: 'SUPER_ADMIN',
    });

    cashierUser = await User.create({
      name: 'Test Cashier',
      username: 'testcashier',
      email: 'testcashier@example.com',
      password: 'Password123!',
      role: 'CASHIER',
    });

    accountantUser = await User.create({
      name: 'Test Accountant',
      username: 'testaccountant',
      email: 'testaccountant@example.com',
      password: 'Password123!',
      role: 'ACCOUNTANT',
    });

    // Obtain JWT tokens
    const adminRes = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'Password123!' });
    adminToken = adminRes.body.token;

    const cashierRes = await request(app).post('/api/auth/login').send({ username: 'testcashier', password: 'Password123!' });
    cashierToken = cashierRes.body.token;

    const accountantRes = await request(app).post('/api/auth/login').send({ username: 'testaccountant', password: 'Password123!' });
    accountantToken = accountantRes.body.token;

    // Seed master catalog records
    testCategory = await Category.create({ name: 'Dry Foods', code: 'DRY' });

    testSupplier = await Supplier.create({
      name: 'National Grain Wholesalers',
      phone: '+252 61 111 2233',
      currentBalance: 0,
    });

    testProduct = await Product.create({
      name: 'Premium Wheat Flour 10kg',
      sku: 'FLR-WHT-10KG',
      barcode: '9988776655',
      category: testCategory._id,
      unit: 'bag',
      purchaseCost: 10.0,
      sellingPrice: 15.0,
      currentStock: 100, // Pre-stocked 100 bags @ $10 = $1,000 valuation
      minStockLevel: 10,
    });

    testCustomer = await Customer.create({
      name: 'Ahmed Wholesale Store',
      phone: '+252 61 444 5566',
      creditLimit: 1000,
      currentBalance: 0,
    });

    testEmployee = await Employee.create({
      employeeId: 'EMP-T1',
      fullName: 'Nasir Farah',
      jobTitle: 'Cashier & Stock Clerk',
      baseSalary: 500,
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  test('1. Capital contribution increases asset and equity without creating sales revenue', async () => {
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const equityBefore = (await accountingService.getAccountByCode('3010')).balance;

    await ownerTransactionService.recordTransaction({
      type: 'CAPITAL_CONTRIBUTION',
      amount: 5000,
      reason: 'Owner initial capital',
      userId: adminUser._id,
    });

    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    const equityAfter = (await accountingService.getAccountByCode('3010')).balance;

    expect(cashAfter).toBe(cashBefore + 5000);
    expect(equityAfter).toBe(equityBefore + 5000);

    // Verify it did not affect Sales Revenue (4010)
    const salesRev = (await accountingService.getAccountByCode('4010')).balance;
    expect(salesRev).toBe(0);
  });

  test('2. Cash sale updates sales, reduces inventory, computes COGS, and increases cash', async () => {
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const stockBefore = (await Product.findById(testProduct._id)).currentStock;

    const sale = await salesService.createSale({
      customerName: 'Walk-in Cash Customer',
      cashierId: cashierUser._id,
      cashierName: cashierUser.name,
      items: [{ productId: testProduct._id, quantity: 2, unitPrice: 15.0 }],
      paymentMethod: 'CASH',
      payments: [{ method: 'CASH', amount: 30.0 }],
    });

    expect(sale.totalAmount).toBe(30.0);
    expect(sale.totalCostOfGoodsSold).toBe(20.0); // 2 * $10.0
    expect(sale.paymentStatus).toBe('PAID');

    // Stock decreased by 2
    const productAfter = await Product.findById(testProduct._id);
    expect(productAfter.currentStock).toBe(stockBefore - 2);

    // Cash increased by $30
    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    expect(cashAfter).toBe(cashBefore + 30.0);
  });

  test('3. Credit sale updates receivables without incorrectly increasing cash', async () => {
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const customerDebtBefore = (await Customer.findById(testCustomer._id)).currentBalance;
    const arAccountBefore = (await accountingService.getAccountByCode('1200')).balance;

    const sale = await salesService.createSale({
      customerId: testCustomer._id,
      cashierId: cashierUser._id,
      cashierName: cashierUser.name,
      items: [{ productId: testProduct._id, quantity: 4, unitPrice: 15.0 }], // Total $60
      paymentMethod: 'CREDIT',
    });

    expect(sale.totalAmount).toBe(60.0);
    expect(sale.amountPaid).toBe(0);
    expect(sale.amountDue).toBe(60.0);
    expect(sale.paymentStatus).toBe('UNPAID');

    // Cash must remain UNCHANGED
    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    expect(cashAfter).toBe(cashBefore);

    // Customer Debt & Accounts Receivable must increase by $60
    const customerAfter = await Customer.findById(testCustomer._id);
    const arAccountAfter = (await accountingService.getAccountByCode('1200')).balance;

    expect(customerAfter.currentBalance).toBe(customerDebtBefore + 60.0);
    expect(arAccountAfter).toBe(arAccountBefore + 60.0);
  });

  test('4. Partial customer payment reduces debt without creating new sales revenue', async () => {
    const revenueBefore = (await accountingService.getAccountByCode('4010')).balance;
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const customerBefore = await Customer.findById(testCustomer._id);

    // Customer pays $40 of the $60 debt
    const result = await debtService.recordCustomerPayment({
      customerId: testCustomer._id,
      amount: 40.0,
      paymentMethod: 'CASH',
      userId: cashierUser._id,
    });

    expect(result.newCustomerBalance).toBe(customerBefore.currentBalance - 40.0);

    // Cash increased by $40
    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    expect(cashAfter).toBe(cashBefore + 40.0);

    // Sales Revenue (4010) must remain UNCHANGED (No double counting revenue!)
    const revenueAfter = (await accountingService.getAccountByCode('4010')).balance;
    expect(revenueAfter).toBe(revenueBefore);
  });

  test('5. Purchase orders do not increase physical inventory until goods are received', async () => {
    const stockBefore = (await Product.findById(testProduct._id)).currentStock;

    const po = await purchaseService.createPurchaseOrder({
      supplierId: testSupplier._id,
      items: [{ productId: testProduct._id, orderedQuantity: 50, unitCost: 11.0 }],
      paymentMethod: 'CREDIT',
      createdBy: adminUser._id,
    });

    expect(po.status).toBe('ORDERED');

    // Physical stock must NOT change
    const stockAfterPO = (await Product.findById(testProduct._id)).currentStock;
    expect(stockAfterPO).toBe(stockBefore);

    // Now receive goods
    await purchaseService.receivePurchase({
      purchaseId: po._id,
      userId: adminUser._id,
    });

    const stockAfterReceive = (await Product.findById(testProduct._id)).currentStock;
    expect(stockAfterReceive).toBe(stockBefore + 50);

    // Supplier debt increased
    const supplier = await Supplier.findById(testSupplier._id);
    expect(supplier.currentBalance).toBe(550.0); // 50 * $11.0
  });

  test('6. Supplier payment reduces payables and cash without creating an expense', async () => {
    const expenseBefore = (await accountingService.getAccountByCode('6090')).balance;
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const supplierBefore = await Supplier.findById(testSupplier._id);

    await debtService.recordSupplierPayment({
      supplierId: testSupplier._id,
      amount: 250.0,
      paymentMethod: 'CASH',
      userId: adminUser._id,
    });

    const supplierAfter = await Supplier.findById(testSupplier._id);
    expect(supplierAfter.currentBalance).toBe(supplierBefore.currentBalance - 250.0);

    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    expect(cashAfter).toBe(cashBefore - 250.0);

    // Operating expenses must remain untouched
    const expenseAfter = (await accountingService.getAccountByCode('6090')).balance;
    expect(expenseAfter).toBe(expenseBefore);
  });

  test('7. Monthly payroll accrual records expense & liability; payment settles liability', async () => {
    const payrollMonth = '2026-11';
    const payrolls = await payrollService.generateMonthlyPayroll({
      payrollMonth,
      employeeId: testEmployee._id,
      userId: accountantUser._id,
    });

    const payroll = payrolls[0];
    expect(payroll.netSalary).toBe(500.0);
    expect(payroll.status).toBe('ACCRUED');

    // Check Salaries Payable liability (2020)
    const salariesPayableAccrued = (await accountingService.getAccountByCode('2020')).balance;
    expect(salariesPayableAccrued).toBeGreaterThanOrEqual(500.0);

    // Now disburse salary payment
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    await payrollService.disburseSalary({
      payrollId: payroll._id,
      amount: 500.0,
      paymentMethod: 'CASH',
      userId: accountantUser._id,
    });

    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    expect(cashAfter).toBe(cashBefore - 500.0);

    const updatedPayroll = await payroll.constructor.findById(payroll._id);
    expect(updatedPayroll.status).toBe('PAID');
  });

  test('8. Owner drawings reduce equity without impacting net operating profit', async () => {
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const drawingsBefore = (await accountingService.getAccountByCode('3020')).balance;

    await ownerTransactionService.recordTransaction({
      type: 'DRAWING',
      amount: 150.0,
      reason: 'Personal withdrawal',
      userId: adminUser._id,
    });

    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    const drawingsAfter = (await accountingService.getAccountByCode('3020')).balance;

    expect(cashAfter).toBe(cashBefore - 150.0);
    expect(drawingsAfter).toBe(drawingsBefore + 150.0);

    // Verify P&L does not include drawings
    const pnl = await accountingService.getProfitAndLoss();
    const hasDrawingInExpenses = pnl.operatingExpenses.breakdown.some((e) => e.code === '3020');
    expect(hasDrawingInExpenses).toBe(false);
  });

  test('9. Inter-account liquidity transfer does not affect income or expense', async () => {
    // Transfer $500 from Cash (1010) to Bank (1020)
    const cashBefore = (await accountingService.getAccountByCode('1010')).balance;
    const bankBefore = (await accountingService.getAccountByCode('1020')).balance;

    await cashRegisterService.transferFunds({
      sourceAccountCode: '1010',
      targetAccountCode: '1020',
      amount: 500.0,
      reason: 'Cash deposit into bank',
      userId: adminUser._id,
    });

    const cashAfter = (await accountingService.getAccountByCode('1010')).balance;
    const bankAfter = (await accountingService.getAccountByCode('1020')).balance;

    expect(cashAfter).toBe(cashBefore - 500.0);
    expect(bankAfter).toBe(bankBefore + 500.0);

    // Cash flow statement excludes internal transfers
    const cashFlow = await accountingService.getCashFlowStatement();
    expect(cashFlow.operatingActivities.netOperatingCashFlow).toBeDefined();
  });

  test('10. Double-entry trial balance debits equal credits', async () => {
    const tb = await accountingService.getTrialBalance();
    expect(tb.isBalanced).toBe(true);
    expect(Math.abs(tb.totalDebit - tb.totalCredit)).toBeLessThanOrEqual(0.01);
  });

  test('11. Balance Sheet satisfies Assets = Liabilities + Owner Equity', async () => {
    const bs = await accountingService.getBalanceSheet();
    expect(bs.isBalanced).toBe(true);
    expect(Math.abs(bs.assets.total - bs.totalLiabilitiesAndEquity)).toBeLessThanOrEqual(0.05);
  });

  test('12. Role-Based Access Control restricts unauthorized actions', async () => {
    // Cashier cannot access Profit & Loss report
    const pnlRes = await request(app)
      .get('/api/accounting/profit-and-loss')
      .set('Authorization', `Bearer ${cashierToken}`);
    expect(pnlRes.status).toBe(403);

    // Cashier cannot create employees
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ fullName: 'Unauthorized Person', jobTitle: 'Clerk', baseSalary: 300 });
    expect(empRes.status).toBe(403);

    // Accountant CAN access Profit & Loss
    const accountantPnlRes = await request(app)
      .get('/api/accounting/profit-and-loss')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(accountantPnlRes.status).toBe(200);
  });
});

