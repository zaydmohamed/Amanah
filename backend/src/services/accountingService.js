const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');

// Standard Chart of Accounts seed blueprint
const DEFAULT_CHART_OF_ACCOUNTS = [
  // ASSETS (1000 - 1999)
  { code: '1010', name: 'Cash on Hand', type: 'ASSET', subType: 'CASH', isSystemAccount: true, description: 'Cash register physical currency' },
  { code: '1020', name: 'Bank Account', type: 'ASSET', subType: 'BANK', isSystemAccount: true, description: 'Commercial bank checking account' },
  { code: '1030', name: 'Mobile Money', type: 'ASSET', subType: 'MOBILE_MONEY', isSystemAccount: true, description: 'EVC Plus / Zaad / Sahal / M-Pesa merchant wallet' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', subType: 'RECEIVABLE', isSystemAccount: true, description: 'Customer credit debt balances' },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET', subType: 'INVENTORY', isSystemAccount: true, description: 'Merchandise on hand valuation' },
  { code: '1500', name: 'Store Equipment & Fixtures', type: 'ASSET', subType: 'FIXED_ASSET', isSystemAccount: true, description: 'Physical store equipment and machinery' },

  // LIABILITIES (2000 - 2999)
  { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', subType: 'PAYABLE', isSystemAccount: true, description: 'Supplier debt payables' },
  { code: '2020', name: 'Salaries Payable', type: 'LIABILITY', subType: 'PAYROLL', isSystemAccount: true, description: 'Accrued unpaid staff compensation' },
  { code: '2030', name: 'Accrued Expenses Payable', type: 'LIABILITY', subType: 'EXPENSE_ACCRUAL', isSystemAccount: true, description: 'Unpaid operating expenses' },
  { code: '2050', name: 'Sales Tax Payable', type: 'LIABILITY', subType: 'TAX', isSystemAccount: true, description: 'Collected sales tax owed to authorities' },

  // EQUITY (3000 - 3999)
  { code: '3010', name: 'Owner Capital', type: 'EQUITY', subType: 'CAPITAL', isSystemAccount: true, description: 'Owner initial and additional capital contributions' },
  { code: '3020', name: 'Owner Drawings', type: 'EQUITY', subType: 'DRAWINGS', isSystemAccount: true, description: 'Contra-equity withdrawals by owner' },
  { code: '3030', name: 'Retained Earnings', type: 'EQUITY', subType: 'RETAINED_EARNINGS', isSystemAccount: true, description: 'Cumulative historical net earnings' },

  // REVENUE (4000 - 4999)
  { code: '4010', name: 'Sales Revenue', type: 'REVENUE', subType: 'OPERATING_REVENUE', isSystemAccount: true, description: 'Gross sales of retail goods' },
  { code: '4020', name: 'Sales Returns & Allowances', type: 'REVENUE', subType: 'CONTRA_REVENUE', isSystemAccount: true, description: 'Customer refunds and returns' },
  { code: '4030', name: 'Sales Discounts', type: 'REVENUE', subType: 'CONTRA_REVENUE', isSystemAccount: true, description: 'Discounts granted on sales invoices' },
  { code: '4090', name: 'Other Income', type: 'REVENUE', subType: 'OTHER_INCOME', isSystemAccount: true, description: 'Miscellaneous revenue' },

  // COST OF GOODS SOLD (5000 - 5999)
  { code: '5010', name: 'Cost of Goods Sold', type: 'COGS', subType: 'COGS', isSystemAccount: true, description: 'Acquisition cost of products sold' },
  { code: '5020', name: 'Inventory Shrinkage & Loss', type: 'COGS', subType: 'COGS_ADJUSTMENT', isSystemAccount: true, description: 'Damaged, expired or lost stock write-offs' },

  // OPERATING EXPENSES (6000 - 6999)
  { code: '6010', name: 'Rent Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Shop and warehouse lease expenses' },
  { code: '6020', name: 'Salaries & Wages Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Staff payroll expense' },
  { code: '6030', name: 'Electricity & Utilities', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Power, water, and municipal utilities' },
  { code: '6040', name: 'Internet & Communications', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Shop Wi-Fi, phone and connectivity' },
  { code: '6050', name: 'Transport & Freight', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'General carriage and local transport' },
  { code: '6060', name: 'Repairs & Maintenance', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Premises and equipment servicing' },
  { code: '6070', name: 'Store Supplies', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Packaging bags, receipt rolls, stationery' },
  { code: '6080', name: 'Bank & Transaction Fees', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Merchant fees and wire charges' },
  { code: '6090', name: 'General Operating Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', isSystemAccount: true, description: 'Sundry and other day-to-day expenses' },
];

class AccountingService {
  /**
   * Initializes standard Chart of Accounts if empty
   */
  async initializeChartOfAccounts() {
    for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
      await Account.findOneAndUpdate(
        { code: acc.code },
        { $setOnInsert: acc },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Generates sequential Journal Entry Number
   */
  async generateEntryNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await JournalEntry.countDocuments();
    return `JE-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Finds an account by its unique code
   */
  async getAccountByCode(code) {
    const account = await Account.findOne({ code, isActive: true });
    if (!account) {
      throw new Error(`Account code '${code}' not found or inactive`);
    }
    return account;
  }

  /**
   * Posts a balanced double-entry journal entry atomically
   * @param {Object} params
   * @param {string} params.reference
   * @param {string} params.description
   * @param {string} params.sourceModule
   * @param {any} params.sourceId
   * @param {Date} params.date
   * @param {Array} params.lines [{ accountCode, debit, credit, description }]
   * @param {string} params.createdBy
   */
  async postJournalEntry({
    reference = '',
    description,
    sourceModule,
    sourceId,
    date = new Date(),
    lines = [],
    createdBy = null,
  }) {
    if (!lines || lines.length < 2) {
      throw new Error('A journal entry must contain at least 2 lines (debit and credit)');
    }

    // Resolve accounts and validate debit/credit lines
    const resolvedLines = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const debit = Math.round((Number(line.debit) || 0) * 100) / 100;
      const credit = Math.round((Number(line.credit) || 0) * 100) / 100;

      if (debit === 0 && credit === 0) continue;
      if (debit > 0 && credit > 0) {
        throw new Error('A journal line cannot have both debit and credit amounts');
      }

      let account = null;
      if (line.accountId) {
        account = await Account.findById(line.accountId);
      } else if (line.accountCode) {
        account = await this.getAccountByCode(line.accountCode);
      }

      if (!account) {
        throw new Error(`Account could not be resolved for line: ${JSON.stringify(line)}`);
      }

      totalDebit += debit;
      totalCredit += credit;

      resolvedLines.push({
        account: account._id,
        accountCode: account.code,
        accountName: account.name,
        debit,
        credit,
        description: line.description || description,
      });
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Double-entry balance check failed: Total Debits (${totalDebit}) != Total Credits (${totalCredit})`);
    }

    const entryNumber = await this.generateEntryNumber();

    const journalEntry = new JournalEntry({
      entryNumber,
      date,
      reference,
      description,
      sourceModule,
      sourceId,
      lines: resolvedLines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      createdBy,
    });

    await journalEntry.save();

    // Update account balances based on fundamental accounting equation
    for (const line of resolvedLines) {
      const account = await Account.findById(line.account);
      if (!account) continue;

      let netChange = 0;
      if (['ASSET', 'EXPENSE', 'COGS'].includes(account.type) || account.subType === 'DRAWINGS') {
        // Normal debit balance: Debits increase, Credits decrease
        netChange = line.debit - line.credit;
      } else {
        // Normal credit balance: Credits increase, Debits decrease (LIABILITY, EQUITY, REVENUE)
        netChange = line.credit - line.debit;
      }

      account.balance = Math.round((account.balance + netChange) * 100) / 100;
      await account.save();
    }

    return journalEntry;
  }

  /**
   * Reverses a posted journal entry with full audit trail
   */
  async reverseJournalEntry(entryId, reason, userId) {
    const originalEntry = await JournalEntry.findById(entryId);
    if (!originalEntry) {
      throw new Error(`Journal entry ${entryId} not found`);
    }
    if (originalEntry.isReversed) {
      throw new Error(`Journal entry ${originalEntry.entryNumber} is already reversed`);
    }

    // Prepare reversing lines (swap debit and credit)
    const reversingLines = originalEntry.lines.map((line) => ({
      accountId: line.account,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.credit, // SWAP
      credit: line.debit, // SWAP
      description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
    }));

    const reversalEntry = await this.postJournalEntry({
      reference: originalEntry.entryNumber,
      description: `[REVERSAL] ${originalEntry.description} - ${reason}`,
      sourceModule: originalEntry.sourceModule,
      sourceId: originalEntry.sourceId,
      lines: reversingLines,
      createdBy: userId,
    });

    originalEntry.isReversed = true;
    originalEntry.reversedByEntry = reversalEntry._id;
    await originalEntry.save();

    return reversalEntry;
  }

  /**
   * Trial Balance as of a specified date
   */
  async getTrialBalance(asOfDate = new Date()) {
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    const targetDate = new Date(asOfDate);

    const rows = [];
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    for (const acc of accounts) {
      // Aggregate all non-reversed journal lines for this account up to asOfDate
      const result = await JournalEntry.aggregate([
        { $match: { date: { $lte: targetDate } } },
        { $unwind: '$lines' },
        { $match: { 'lines.account': acc._id } },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' },
          },
        },
      ]);

      const totalDebit = result.length > 0 ? Math.round(result[0].totalDebit * 100) / 100 : 0;
      const totalCredit = result.length > 0 ? Math.round(result[0].totalCredit * 100) / 100 : 0;

      let netDebit = 0;
      let netCredit = 0;

      if (['ASSET', 'EXPENSE', 'COGS'].includes(acc.type)) {
        const net = totalDebit - totalCredit;
        if (net >= 0) {
          netDebit = net;
        } else {
          netCredit = Math.abs(net);
        }
      } else {
        const net = totalCredit - totalDebit;
        if (net >= 0) {
          netCredit = net;
        } else {
          netDebit = Math.abs(net);
        }
      }

      if (netDebit > 0 || netCredit > 0) {
        rows.push({
          accountId: acc._id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          subType: acc.subType,
          debit: Math.round(netDebit * 100) / 100,
          credit: Math.round(netCredit * 100) / 100,
        });

        totalDebitSum += netDebit;
        totalCreditSum += netCredit;
      }
    }

    totalDebitSum = Math.round(totalDebitSum * 100) / 100;
    totalCreditSum = Math.round(totalCreditSum * 100) / 100;

    return {
      asOfDate: targetDate,
      rows,
      totalDebit: totalDebitSum,
      totalCredit: totalCreditSum,
      isBalanced: Math.abs(totalDebitSum - totalCreditSum) <= 0.01,
      difference: Math.round(Math.abs(totalDebitSum - totalCreditSum) * 100) / 100,
    };
  }

  /**
   * General Ledger for a specific account with running balance
   */
  async getGeneralLedger(accountCode, startDate, endDate) {
    const account = await this.getAccountByCode(accountCode);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Calculate opening balance before startDate
    const openingResult = await JournalEntry.aggregate([
      { $match: { date: { $lt: start } } },
      { $unwind: '$lines' },
      { $match: { 'lines.account': account._id } },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
    ]);

    let openingBalance = 0;
    if (openingResult.length > 0) {
      const d = openingResult[0].totalDebit;
      const c = openingResult[0].totalCredit;
      openingBalance = ['ASSET', 'EXPENSE', 'COGS'].includes(account.type) || account.subType === 'DRAWINGS' ? d - c : c - d;
    }
    openingBalance = Math.round(openingBalance * 100) / 100;

    // 2. Fetch all entries within the period
    const entries = await JournalEntry.find({
      date: { $gte: start, $lte: end },
      'lines.account': account._id,
    }).sort({ date: 1, entryNumber: 1 });

    let runningBalance = openingBalance;
    const ledgerLines = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.account.toString() === account._id.toString()) {
          if (['ASSET', 'EXPENSE', 'COGS'].includes(account.type) || account.subType === 'DRAWINGS') {
            runningBalance += line.debit - line.credit;
          } else {
            runningBalance += line.credit - line.debit;
          }
          runningBalance = Math.round(runningBalance * 100) / 100;

          ledgerLines.push({
            date: entry.date,
            entryNumber: entry.entryNumber,
            reference: entry.reference,
            description: line.description || entry.description,
            sourceModule: entry.sourceModule,
            debit: line.debit,
            credit: line.credit,
            balance: runningBalance,
          });
        }
      }
    }

    return {
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      period: { start, end },
      openingBalance,
      closingBalance: runningBalance,
      transactions: ledgerLines,
    };
  }

  /**
   * Generates Accrual Profit & Loss Statement
   */
  async getProfitAndLoss(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const pipeline = [
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: '$lines' },
      {
        $lookup: {
          from: 'accounts',
          localField: 'lines.account',
          foreignField: '_id',
          as: 'accountDetails',
        },
      },
      { $unwind: '$accountDetails' },
      {
        $match: {
          'accountDetails.type': { $in: ['REVENUE', 'COGS', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: {
            code: '$accountDetails.code',
            name: '$accountDetails.name',
            type: '$accountDetails.type',
            subType: '$accountDetails.subType',
          },
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
      { $sort: { '_id.code': 1 } },
    ];

    const results = await JournalEntry.aggregate(pipeline);

    let grossSales = 0;
    let salesReturns = 0;
    let salesDiscounts = 0;
    let otherIncome = 0;
    let totalCOGS = 0;
    let totalOperatingExpenses = 0;

    const revenueBreakdown = [];
    const cogsBreakdown = [];
    const expenseBreakdown = [];

    for (const item of results) {
      const code = item._id.code;
      const name = item._id.name;
      const type = item._id.type;
      const subType = item._id.subType;
      const debit = item.totalDebit;
      const credit = item.totalCredit;

      if (type === 'REVENUE') {
        if (code === '4010') {
          const amount = credit - debit;
          grossSales += amount;
          revenueBreakdown.push({ code, name, amount });
        } else if (code === '4020') {
          const amount = debit - credit;
          salesReturns += amount;
          revenueBreakdown.push({ code, name, amount: -amount });
        } else if (code === '4030') {
          const amount = debit - credit;
          salesDiscounts += amount;
          revenueBreakdown.push({ code, name, amount: -amount });
        } else {
          const amount = credit - debit;
          otherIncome += amount;
          revenueBreakdown.push({ code, name, amount });
        }
      } else if (type === 'COGS') {
        const amount = debit - credit;
        totalCOGS += amount;
        cogsBreakdown.push({ code, name, amount });
      } else if (type === 'EXPENSE') {
        const amount = debit - credit;
        totalOperatingExpenses += amount;
        expenseBreakdown.push({ code, name, subType, amount });
      }
    }

    const netSales = Math.round((grossSales - salesReturns - salesDiscounts) * 100) / 100;
    const grossProfit = Math.round((netSales - totalCOGS) * 100) / 100;
    const netProfit = Math.round((grossProfit + otherIncome - totalOperatingExpenses) * 100) / 100;

    const grossMargin = netSales > 0 ? Math.round((grossProfit / netSales) * 10000) / 100 : 0;
    const netMargin = netSales > 0 ? Math.round((netProfit / netSales) * 10000) / 100 : 0;

    return {
      period: { start, end },
      revenue: {
        grossSales: Math.round(grossSales * 100) / 100,
        salesReturns: Math.round(salesReturns * 100) / 100,
        salesDiscounts: Math.round(salesDiscounts * 100) / 100,
        otherIncome: Math.round(otherIncome * 100) / 100,
        netSales,
        breakdown: revenueBreakdown,
      },
      costOfGoodsSold: {
        total: Math.round(totalCOGS * 100) / 100,
        breakdown: cogsBreakdown,
      },
      grossProfit,
      operatingExpenses: {
        total: Math.round(totalOperatingExpenses * 100) / 100,
        breakdown: expenseBreakdown,
      },
      netProfit,
      margins: {
        grossMarginPercentage: grossMargin,
        netMarginPercentage: netMargin,
      },
    };
  }

  /**
   * Generates Balance Sheet Statement (Assets = Liabilities + Equity)
   */
  async getBalanceSheet(asOfDate = new Date()) {
    const targetDate = new Date(asOfDate);

    // 1. Calculate P&L Net Profit up to asOfDate to properly reflect Retained Earnings / Current Profit
    const pnl = await this.getProfitAndLoss(new Date(0), targetDate);
    const cumulativeNetProfit = pnl.netProfit;

    // 2. Fetch all balance sheet accounts
    const accounts = await Account.find({
      type: { $in: ['ASSET', 'LIABILITY', 'EQUITY'] },
      isActive: true,
    }).sort({ code: 1 });

    const assets = [];
    const liabilities = [];
    const equity = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      const result = await JournalEntry.aggregate([
        { $match: { date: { $lte: targetDate } } },
        { $unwind: '$lines' },
        { $match: { 'lines.account': acc._id } },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: '$lines.debit' },
            totalCredit: { $sum: '$lines.credit' },
          },
        },
      ]);

      const totalDebit = result.length > 0 ? result[0].totalDebit : 0;
      const totalCredit = result.length > 0 ? result[0].totalCredit : 0;

      let balance = 0;
      if (acc.type === 'ASSET') {
        balance = totalDebit - totalCredit;
        balance = Math.round(balance * 100) / 100;
        assets.push({ code: acc.code, name: acc.name, subType: acc.subType, balance });
        totalAssets += balance;
      } else if (acc.type === 'LIABILITY') {
        balance = totalCredit - totalDebit;
        balance = Math.round(balance * 100) / 100;
        liabilities.push({ code: acc.code, name: acc.name, subType: acc.subType, balance });
        totalLiabilities += balance;
      } else if (acc.type === 'EQUITY') {
        // Handle Owner Drawings as contra-equity (normally debit balance)
        if (acc.code === '3020') {
          balance = totalDebit - totalCredit; // Contra-equity positive represents withdrawal
          balance = Math.round(balance * 100) / 100;
          equity.push({ code: acc.code, name: acc.name, subType: acc.subType, balance: -balance });
          totalEquity -= balance;
        } else {
          balance = totalCredit - totalDebit;
          balance = Math.round(balance * 100) / 100;
          equity.push({ code: acc.code, name: acc.name, subType: acc.subType, balance });
          totalEquity += balance;
        }
      }
    }

    // Add cumulative net profit/loss into equity
    equity.push({
      code: 'NET_PROFIT',
      name: 'Current Period Retained Profit / (Loss)',
      subType: 'CURRENT_EARNINGS',
      balance: cumulativeNetProfit,
    });
    totalEquity += cumulativeNetProfit;

    totalAssets = Math.round(totalAssets * 100) / 100;
    totalLiabilities = Math.round(totalLiabilities * 100) / 100;
    totalEquity = Math.round(totalEquity * 100) / 100;

    const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
    const difference = Math.round(Math.abs(totalAssets - totalLiabilitiesAndEquity) * 100) / 100;
    const isBalanced = difference <= 0.05; // Accept minor rounding tolerance

    return {
      asOfDate: targetDate,
      assets: {
        total: totalAssets,
        accounts: assets,
      },
      liabilities: {
        total: totalLiabilities,
        accounts: liabilities,
      },
      equity: {
        total: totalEquity,
        accounts: equity,
      },
      totalLiabilitiesAndEquity,
      isBalanced,
      difference,
    };
  }

  /**
   * Generates Direct Method Cash Flow Statement
   */
  async getCashFlowStatement(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Accounts considered Cash & Cash Equivalents: 1010 (Cash), 1020 (Bank), 1030 (Mobile Money)
    const cashAccounts = await Account.find({ code: { $in: ['1010', '1020', '1030'] } });
    const cashAccountIds = cashAccounts.map((a) => a._id);

    // 1. Opening Cash Balance before startDate
    const openingResult = await JournalEntry.aggregate([
      { $match: { date: { $lt: start } } },
      { $unwind: '$lines' },
      { $match: { 'lines.account': { $in: cashAccountIds } } },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$lines.debit' },
          totalCredit: { $sum: '$lines.credit' },
        },
      },
    ]);

    const openingCash = openingResult.length > 0
      ? Math.round((openingResult[0].totalDebit - openingResult[0].totalCredit) * 100) / 100
      : 0;

    // 2. Query entries affecting cash in the period
    const entries = await JournalEntry.find({
      date: { $gte: start, $lte: end },
      'lines.account': { $in: cashAccountIds },
    });

    let customerCollections = 0;
    let cashSales = 0;
    let supplierPayments = 0;
    let cashPurchases = 0;
    let salariesPaid = 0;
    let operatingExpensesPaid = 0;
    let capitalContributions = 0;
    let ownerDrawings = 0;
    let equipmentPurchases = 0;

    for (const entry of entries) {
      if (entry.sourceModule === 'INTERNAL_TRANSFER') {
        // Exclude internal transfers between cash/bank accounts
        continue;
      }

      for (const line of entry.lines) {
        if (!cashAccountIds.some((id) => id.toString() === line.account.toString())) {
          continue;
        }

        const netCashFlow = line.debit - line.credit;

        switch (entry.sourceModule) {
          case 'SALES':
            if (netCashFlow > 0) cashSales += netCashFlow;
            break;
          case 'CUSTOMER_PAYMENT':
            if (netCashFlow > 0) customerCollections += netCashFlow;
            break;
          case 'PURCHASES':
            if (netCashFlow < 0) cashPurchases += Math.abs(netCashFlow);
            break;
          case 'SUPPLIER_PAYMENT':
            if (netCashFlow < 0) supplierPayments += Math.abs(netCashFlow);
            break;
          case 'PAYROLL_PAYMENT':
            if (netCashFlow < 0) salariesPaid += Math.abs(netCashFlow);
            break;
          case 'EXPENSE':
            if (netCashFlow < 0) operatingExpensesPaid += Math.abs(netCashFlow);
            break;
          case 'OWNER_CAPITAL':
            if (netCashFlow > 0) capitalContributions += netCashFlow;
            break;
          case 'OWNER_DRAWING':
            if (netCashFlow < 0) ownerDrawings += Math.abs(netCashFlow);
            break;
        }
      }
    }

    const netOperatingCashFlow = Math.round(
      (cashSales + customerCollections - supplierPayments - cashPurchases - salariesPaid - operatingExpensesPaid) * 100
    ) / 100;

    const netInvestingCashFlow = -Math.round(equipmentPurchases * 100) / 100;

    const netFinancingCashFlow = Math.round((capitalContributions - ownerDrawings) * 100) / 100;

    const netChangeInCash = Math.round((netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow) * 100) / 100;
    const closingCash = Math.round((openingCash + netChangeInCash) * 100) / 100;

    return {
      period: { start, end },
      openingCash,
      operatingActivities: {
        cashFromSales: Math.round(cashSales * 100) / 100,
        customerDebtCollections: Math.round(customerCollections * 100) / 100,
        paymentsToSuppliers: Math.round((supplierPayments + cashPurchases) * 100) / 100,
        salariesPaid: Math.round(salariesPaid * 100) / 100,
        operatingExpensesPaid: Math.round(operatingExpensesPaid * 100) / 100,
        netOperatingCashFlow,
      },
      investingActivities: {
        equipmentPurchases: Math.round(equipmentPurchases * 100) / 100,
        netInvestingCashFlow,
      },
      financingActivities: {
        ownerCapitalContributions: Math.round(capitalContributions * 100) / 100,
        ownerDrawings: Math.round(ownerDrawings * 100) / 100,
        netFinancingCashFlow,
      },
      summary: {
        openingCash,
        netChangeInCash,
        closingCash,
      },
    };
  }
}

module.exports = new AccountingService();

