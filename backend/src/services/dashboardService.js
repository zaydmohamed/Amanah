const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const CustomerPayment = require('../models/CustomerPayment');
const SupplierPayment = require('../models/SupplierPayment');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Payroll = require('../models/Payroll');
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const accountingService = require('./accountingService');

class DashboardService {
  async getDashboardMetrics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Today's metrics
    const todaySalesData = await Sale.aggregate([
      { $match: { saleDate: { $gte: startOfToday, $lte: endOfToday }, status: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalCOGS: { $sum: '$totalCostOfGoodsSold' },
          totalPaidImmediately: { $sum: '$amountPaid' },
        },
      },
    ]);

    const todaySales = todaySalesData.length > 0 ? todaySalesData[0].totalSales : 0;
    const todayCOGS = todaySalesData.length > 0 ? todaySalesData[0].totalCOGS : 0;
    const todayGrossProfit = Math.round((todaySales - todayCOGS) * 100) / 100;

    // Today's Debt Collections
    const todayDebtCollectionsData = await CustomerPayment.aggregate([
      { $match: { date: { $gte: startOfToday, $lte: endOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayDebtCollections = todayDebtCollectionsData.length > 0 ? todayDebtCollectionsData[0].total : 0;

    // Today's Total Cash Collections = Immediate cash from sales + Debt collections
    const todayImmediateCashSales = todaySalesData.length > 0 ? todaySalesData[0].totalPaidImmediately : 0;
    const todayTotalCashCollections = Math.round((todayImmediateCashSales + todayDebtCollections) * 100) / 100;

    // 2. Monthly P&L from Accounting Engine
    const monthlyPnL = await accountingService.getProfitAndLoss(startOfMonth, endOfMonth);

    // 3. Outstanding Balances & Asset Accounts
    const customerReceivableResult = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } },
    ]);
    const totalCustomerReceivables = customerReceivableResult.length > 0 ? customerReceivableResult[0].total : 0;

    const supplierPayableResult = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } },
    ]);
    const totalSupplierPayables = supplierPayableResult.length > 0 ? supplierPayableResult[0].total : 0;

    // Inventory Valuation
    const inventoryValuationResult = await Product.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$purchaseCost'] } },
          totalItems: { $sum: '$currentStock' },
        },
      },
    ]);
    const totalInventoryValue =
      inventoryValuationResult.length > 0 ? Math.round(inventoryValuationResult[0].totalValue * 100) / 100 : 0;

    // Unpaid Salaries
    const unpaidSalariesResult = await Payroll.aggregate([
      { $match: { status: { $in: ['ACCRUED', 'PARTIALLY_PAID'] } } },
      { $group: { _id: null, total: { $sum: '$amountDue' } } },
    ]);
    const unpaidSalaries = unpaidSalariesResult.length > 0 ? unpaidSalariesResult[0].total : 0;

    // Liquid Accounts
    const cashAccount = await Account.findOne({ code: '1010' });
    const bankAccount = await Account.findOne({ code: '1020' });
    const mobileMoneyAccount = await Account.findOne({ code: '1030' });

    // Stock Alerts
    const lowStockCount = await Product.countDocuments({
      status: 'ACTIVE',
      $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStockLevel'] }] },
    });

    const outOfStockCount = await Product.countDocuments({
      status: 'ACTIVE',
      currentStock: { $lte: 0 },
    });

    // 4. Interactive Trend Data (Last 7 Days)
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const dailySalesTrends = await Sale.aggregate([
      { $match: { saleDate: { $gte: sevenDaysAgo }, status: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          sales: { $sum: '$totalAmount' },
          cogs: { $sum: '$totalCostOfGoodsSold' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          sales: { $round: ['$sales', 2] },
          profit: { $round: [{ $subtract: ['$sales', '$cogs'] }, 2] },
        },
      },
    ]);

    // Expenses by Category (Current Month)
    const expenseByCategory = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: '$categoryName',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          category: '$_id',
          amount: { $round: ['$total', 2] },
        },
      },
    ]);

    // Top 5 Best Selling Products (Quantity and Revenue)
    const bestSelling = await Sale.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // Recent Transactions
    const recentSales = await Sale.find().sort({ saleDate: -1 }).limit(5).select('invoiceNumber customerName totalAmount paymentStatus saleDate');
    const recentPurchases = await Purchase.find().sort({ purchaseDate: -1 }).limit(5).populate('supplier', 'name').select('purchaseNumber supplier totalAmount status purchaseDate');
    const recentCustomerPayments = await CustomerPayment.find().sort({ date: -1 }).limit(5).populate('customer', 'name').select('paymentNumber customer amount paymentMethod date');
    const recentExpenses = await Expense.find().sort({ date: -1 }).limit(5).select('expenseNumber categoryName amount paymentMethod date description');

    return {
      cards: {
        todaySales: Math.round(todaySales * 100) / 100,
        todayTotalCashCollections,
        todayGrossProfit,
        monthlySales: monthlyPnL.revenue.netSales,
        monthlyNetProfit: monthlyPnL.netProfit,
        totalCustomerReceivables: Math.round(totalCustomerReceivables * 100) / 100,
        totalSupplierPayables: Math.round(totalSupplierPayables * 100) / 100,
        totalInventoryValue,
        totalOperatingExpenses: monthlyPnL.operatingExpenses.total,
        cashInHand: cashAccount ? cashAccount.balance : 0,
        bankBalances: bankAccount ? bankAccount.balance : 0,
        mobileMoneyBalances: mobileMoneyAccount ? mobileMoneyAccount.balance : 0,
        unpaidSalaries: Math.round(unpaidSalaries * 100) / 100,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
      },
      charts: {
        dailySalesTrends,
        expenseByCategory,
        bestSellingProducts: bestSelling,
      },
      recent: {
        sales: recentSales,
        purchases: recentPurchases,
        customerPayments: recentCustomerPayments,
        expenses: recentExpenses,
      },
    };
  }
}

module.exports = new DashboardService();

