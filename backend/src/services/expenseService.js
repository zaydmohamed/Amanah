const Expense = require('../models/Expense');
const Account = require('../models/Account');
const accountingService = require('./accountingService');

class ExpenseService {
  async generateExpenseNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await Expense.countDocuments();
    return `EXP-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  async recordExpense({
    categoryAccountId,
    description,
    amount,
    paymentMethod = 'CASH',
    paymentAccountId = null,
    payee = '',
    receiptUrl = '',
    notes = '',
    userId,
  }) {
    const categoryAccount = await Account.findById(categoryAccountId);
    if (!categoryAccount || categoryAccount.type !== 'EXPENSE') {
      throw new Error('Valid expense category account is required');
    }

    const expAmount = Math.round(Number(amount) * 100) / 100;
    if (expAmount <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }

    const expenseNumber = await this.generateExpenseNumber();
    const isUnpaid = paymentMethod === 'UNPAID';

    let paymentAccount = null;
    if (!isUnpaid) {
      if (paymentAccountId) {
        paymentAccount = await Account.findById(paymentAccountId);
      } else {
        const code = paymentMethod === 'BANK_TRANSFER' ? '1020' : paymentMethod === 'MOBILE_MONEY' ? '1030' : '1010';
        paymentAccount = await accountingService.getAccountByCode(code);
      }
    }

    // Post Double-Entry Journal Entry:
    // DR 60xx Category Expense Account
    // CR 1010/1020/1030 Cash/Bank/Mobile Money (if paid) OR 2030 Accrued Expenses Payable (if unpaid)
    const creditAccountCode = isUnpaid ? '2030' : paymentAccount.code;

    const journalEntry = await accountingService.postJournalEntry({
      reference: expenseNumber,
      description: `Expense: ${categoryAccount.name} - ${description}`,
      sourceModule: 'EXPENSE',
      sourceId: null,
      lines: [
        {
          accountCode: categoryAccount.code,
          debit: expAmount,
          credit: 0,
          description: `${categoryAccount.name}: ${description}`,
        },
        {
          accountCode: creditAccountCode,
          debit: 0,
          credit: expAmount,
          description: isUnpaid ? 'Accrued unpaid expense' : `Paid via ${paymentMethod}`,
        },
      ],
      createdBy: userId,
    });

    const expense = new Expense({
      expenseNumber,
      categoryAccount: categoryAccount._id,
      categoryName: categoryAccount.name,
      description,
      amount: expAmount,
      paymentMethod,
      paymentAccount: paymentAccount ? paymentAccount._id : null,
      payee,
      status: isUnpaid ? 'UNPAID' : 'PAID',
      receiptUrl,
      journalEntry: journalEntry._id,
      createdBy: userId,
      notes,
    });

    await expense.save();
    return expense;
  }

  /**
   * Settle an unpaid accrued expense
   */
  async payUnpaidExpense({ expenseId, paymentMethod = 'CASH', sourceAccountId = null, userId }) {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.status !== 'UNPAID') {
      throw new Error('Expense is already paid or cancelled');
    }

    const code = paymentMethod === 'BANK_TRANSFER' ? '1020' : paymentMethod === 'MOBILE_MONEY' ? '1030' : '1010';
    let sourceAccount = null;
    if (sourceAccountId) {
      sourceAccount = await Account.findById(sourceAccountId);
    } else {
      sourceAccount = await accountingService.getAccountByCode(code);
    }

    // Post Settle Liability Entry:
    // DR 2030 Accrued Expenses Payable
    // CR 1010/1020 Cash/Bank
    await accountingService.postJournalEntry({
      reference: `SETTLE-${expense.expenseNumber}`,
      description: `Settlement of accrued expense ${expense.expenseNumber} (${expense.description})`,
      sourceModule: 'EXPENSE',
      sourceId: expense._id,
      lines: [
        {
          accountCode: '2030',
          debit: expense.amount,
          credit: 0,
          description: `Settling accrued liability for ${expense.expenseNumber}`,
        },
        {
          accountCode: sourceAccount.code,
          debit: 0,
          credit: expense.amount,
          description: `Disbursed via ${paymentMethod}`,
        },
      ],
      createdBy: userId,
    });

    expense.status = 'PAID';
    expense.paymentMethod = paymentMethod;
    expense.paymentAccount = sourceAccount._id;
    await expense.save();

    return expense;
  }
}

module.exports = new ExpenseService();

