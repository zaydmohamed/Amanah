const OwnerTransaction = require('../models/OwnerTransaction');
const Account = require('../models/Account');
const accountingService = require('./accountingService');

class OwnerTransactionService {
  async generateTransactionNumber(type) {
    const prefix = type === 'DRAWING' ? 'OD' : 'OC';
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await OwnerTransaction.countDocuments({ type });
    return `${prefix}-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Record Owner Drawing or Owner Capital Contribution
   */
  async recordTransaction({ type, amount, paymentAccountId = null, reason, notes = '', userId }) {
    if (!['DRAWING', 'CAPITAL_CONTRIBUTION'].includes(type)) {
      throw new Error('Transaction type must be DRAWING or CAPITAL_CONTRIBUTION');
    }

    const txAmount = Math.round(Number(amount) * 100) / 100;
    if (txAmount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    let paymentAccount = null;
    if (paymentAccountId) {
      paymentAccount = await Account.findById(paymentAccountId);
    } else {
      paymentAccount = await accountingService.getAccountByCode('1010'); // Default to Cash
    }

    const txNumber = await this.generateTransactionNumber(type);

    let journalLines = [];
    if (type === 'DRAWING') {
      // Owner Drawing:
      // DR 3020 Owner Drawings (Contra-Equity reduces equity)
      // CR 1010/1020 Cash/Bank (Cash decreases)
      journalLines = [
        {
          accountCode: '3020',
          debit: txAmount,
          credit: 0,
          description: `Owner withdrawal: ${reason}`,
        },
        {
          accountCode: paymentAccount.code,
          debit: 0,
          credit: txAmount,
          description: `Disbursed from ${paymentAccount.name}`,
        },
      ];
    } else {
      // Capital Contribution:
      // DR 1010/1020 Cash/Bank (Cash increases)
      // CR 3010 Owner Capital (Equity increases)
      journalLines = [
        {
          accountCode: paymentAccount.code,
          debit: txAmount,
          credit: 0,
          description: `Capital deposit into ${paymentAccount.name}`,
        },
        {
          accountCode: '3010',
          debit: 0,
          credit: txAmount,
          description: `Owner capital injection: ${reason}`,
        },
      ];
    }

    const journalEntry = await accountingService.postJournalEntry({
      reference: txNumber,
      description: `${type === 'DRAWING' ? 'Owner Drawing' : 'Capital Contribution'}: ${reason}`,
      sourceModule: type === 'DRAWING' ? 'OWNER_DRAWING' : 'OWNER_CAPITAL',
      sourceId: null,
      lines: journalLines,
      createdBy: userId,
    });

    const transaction = new OwnerTransaction({
      transactionNumber: txNumber,
      type,
      amount: txAmount,
      paymentAccount: paymentAccount._id,
      reason,
      journalEntry: journalEntry._id,
      recordedBy: userId,
      notes,
    });

    await transaction.save();
    return transaction;
  }
}

module.exports = new OwnerTransactionService();

