const CashierShift = require('../models/CashierShift');
const Account = require('../models/Account');
const accountingService = require('./accountingService');

class CashRegisterService {
  /**
   * Start a new shift for a cashier
   */
  async openShift({ cashierId, cashierName, openingCash = 0, notes = '' }) {
    const existing = await CashierShift.findOne({
      cashier: cashierId,
      status: 'OPEN',
    });

    if (existing) {
      throw new Error(`You already have an active open shift started at ${existing.startTime.toLocaleTimeString()}`);
    }

    const shift = new CashierShift({
      cashier: cashierId,
      cashierName,
      startTime: new Date(),
      openingCash: Math.round(Number(openingCash) * 100) / 100,
      totalCashSales: 0,
      totalDebtCollections: 0,
      totalCashPayouts: 0,
      expectedClosingCash: Math.round(Number(openingCash) * 100) / 100,
      status: 'OPEN',
      notes,
    });

    await shift.save();
    return shift;
  }

  /**
   * Close active shift and reconcile cash drawer
   */
  async closeShift({ shiftId, actualClosingCash, notes = '', userId }) {
    const shift = await CashierShift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    const countedCash = Math.round(Number(actualClosingCash) * 100) / 100;
    const expected = Math.round(
      (shift.openingCash + shift.totalCashSales + shift.totalDebtCollections - shift.totalCashPayouts) * 100
    ) / 100;

    const shortageOrOverage = Math.round((countedCash - expected) * 100) / 100;

    shift.endTime = new Date();
    shift.expectedClosingCash = expected;
    shift.actualClosingCash = countedCash;
    shift.shortageOrOverage = shortageOrOverage;
    shift.status = 'CLOSED';
    if (notes) shift.notes = shift.notes ? `${shift.notes} | ${notes}` : notes;

    await shift.save();
    return shift;
  }

  /**
   * Inter-account liquidity transfer (e.g., Cash on Hand to Bank or Mobile Money to Bank)
   */
  async transferFunds({ sourceAccountCode, targetAccountCode, amount, reason = '', userId }) {
    const transferAmount = Math.round(Number(amount) * 100) / 100;
    if (transferAmount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }
    if (sourceAccountCode === targetAccountCode) {
      throw new Error('Source and destination accounts must be different');
    }

    const sourceAccount = await accountingService.getAccountByCode(sourceAccountCode);
    const targetAccount = await accountingService.getAccountByCode(targetAccountCode);

    if (sourceAccount.balance < transferAmount) {
      throw new Error(
        `Insufficient funds in ${sourceAccount.name}. Available: $${sourceAccount.balance}, Requested: $${transferAmount}`
      );
    }

    // Post Double-Entry Journal Entry:
    // DR Destination Account (Asset increases)
    // CR Source Account (Asset decreases)
    // SourceModule = 'INTERNAL_TRANSFER'
    const journalEntry = await accountingService.postJournalEntry({
      reference: `TRF-${Date.now().toString().slice(-6)}`,
      description: `Internal Transfer: $${transferAmount} from ${sourceAccount.name} to ${targetAccount.name} (${reason})`,
      sourceModule: 'INTERNAL_TRANSFER',
      sourceId: null,
      lines: [
        {
          accountCode: targetAccount.code,
          debit: transferAmount,
          credit: 0,
          description: `Transfer in from ${sourceAccount.name}`,
        },
        {
          accountCode: sourceAccount.code,
          debit: 0,
          credit: transferAmount,
          description: `Transfer out to ${targetAccount.name}`,
        },
      ],
      createdBy: userId,
    });

    return { journalEntry, sourceAccount, targetAccount, transferAmount };
  }
}

module.exports = new CashRegisterService();

