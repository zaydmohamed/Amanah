const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const CashierShift = require('../models/CashierShift');
const Account = require('../models/Account');
const accountingService = require('./accountingService');

class DebtService {
  async generateCustomerPaymentNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await CustomerPayment.countDocuments();
    return `CP-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  async generateSupplierPaymentNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await SupplierPayment.countDocuments();
    return `SP-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Record a customer debt settlement
   */
  async recordCustomerPayment({
    customerId,
    amount,
    paymentMethod = 'CASH',
    targetAccountId = null,
    reference = '',
    notes = '',
    userId,
  }) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const payAmount = Math.round(Number(amount) * 100) / 100;
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Determine target asset account (Cash, Bank, or Mobile Money)
    let accountCode = '1010'; // Cash on Hand
    if (paymentMethod === 'BANK_TRANSFER') accountCode = '1020';
    if (paymentMethod === 'MOBILE_MONEY') accountCode = '1030';

    let targetAccount = null;
    if (targetAccountId) {
      targetAccount = await Account.findById(targetAccountId);
    } else {
      targetAccount = await accountingService.getAccountByCode(accountCode);
    }

    // Allocate payment to customer's oldest unpaid or partially paid sales invoices
    const unpaidSales = await Sale.find({
      customer: customer._id,
      paymentStatus: { $in: ['UNPAID', 'PARTIAL'] },
    }).sort({ saleDate: 1 });

    let remainingToAllocate = payAmount;
    const allocatedInvoices = [];

    for (const sale of unpaidSales) {
      if (remainingToAllocate <= 0) break;

      const allocation = Math.min(remainingToAllocate, sale.amountDue);
      sale.amountPaid = Math.round((sale.amountPaid + allocation) * 100) / 100;
      sale.amountDue = Math.round((sale.amountDue - allocation) * 100) / 100;
      sale.paymentStatus = sale.amountDue === 0 ? 'PAID' : 'PARTIAL';
      await sale.save();

      allocatedInvoices.push({
        sale: sale._id,
        invoiceNumber: sale.invoiceNumber,
        amountAllocated: allocation,
      });

      remainingToAllocate = Math.round((remainingToAllocate - allocation) * 100) / 100;
    }

    // Update customer debt balance
    customer.currentBalance = Math.round((customer.currentBalance - payAmount) * 100) / 100;
    await customer.save();

    // Check cashier shift if cash payment
    const activeShift = await CashierShift.findOne({
      cashier: userId,
      status: 'OPEN',
    });

    if (activeShift && paymentMethod === 'CASH') {
      activeShift.totalDebtCollections = Math.round((activeShift.totalDebtCollections + payAmount) * 100) / 100;
      activeShift.expectedClosingCash =
        Math.round((activeShift.openingCash + activeShift.totalCashSales + activeShift.totalDebtCollections - activeShift.totalCashPayouts) * 100) / 100;
      await activeShift.save();
    }

    const paymentNumber = await this.generateCustomerPaymentNumber();

    // Post Double-Entry Journal Entry:
    // DR 1010/1020/1030 Cash/Bank/Mobile Money (Money in)
    // CR 1200 Accounts Receivable (Debt settled)
    // NOTE: Does NOT touch Sales Revenue (4010)
    const journalEntry = await accountingService.postJournalEntry({
      reference: paymentNumber,
      description: `Customer debt collection: ${customer.name} (${paymentNumber})`,
      sourceModule: 'CUSTOMER_PAYMENT',
      sourceId: null,
      lines: [
        {
          accountCode: targetAccount.code,
          debit: payAmount,
          credit: 0,
          description: `Received via ${paymentMethod} from ${customer.name}`,
        },
        {
          accountCode: '1200',
          debit: 0,
          credit: payAmount,
          description: `Accounts Receivable settlement for ${customer.name}`,
        },
      ],
      createdBy: userId,
    });

    const payment = new CustomerPayment({
      paymentNumber,
      customer: customer._id,
      amount: payAmount,
      paymentMethod,
      targetAccount: targetAccount._id,
      reference,
      notes,
      allocatedInvoices,
      receivedBy: userId,
      journalEntry: journalEntry._id,
      date: new Date(),
    });

    await payment.save();

    return { payment, newCustomerBalance: customer.currentBalance };
  }

  /**
   * Record a supplier debt payment
   */
  async recordSupplierPayment({
    supplierId,
    amount,
    paymentMethod = 'CASH',
    sourceAccountId = null,
    reference = '',
    notes = '',
    userId,
  }) {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const payAmount = Math.round(Number(amount) * 100) / 100;
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    let accountCode = '1010';
    if (paymentMethod === 'BANK_TRANSFER') accountCode = '1020';
    if (paymentMethod === 'MOBILE_MONEY') accountCode = '1030';

    let sourceAccount = null;
    if (sourceAccountId) {
      sourceAccount = await Account.findById(sourceAccountId);
    } else {
      sourceAccount = await accountingService.getAccountByCode(accountCode);
    }

    // Allocate payment to oldest unpaid purchase orders
    const unpaidPurchases = await Purchase.find({
      supplier: supplier._id,
      paymentStatus: { $in: ['UNPAID', 'PARTIAL'] },
    }).sort({ purchaseDate: 1 });

    let remainingToAllocate = payAmount;
    const allocatedPurchases = [];

    for (const purchase of unpaidPurchases) {
      if (remainingToAllocate <= 0) break;

      const allocation = Math.min(remainingToAllocate, purchase.amountDue);
      purchase.amountPaid = Math.round((purchase.amountPaid + allocation) * 100) / 100;
      purchase.amountDue = Math.round((purchase.amountDue - allocation) * 100) / 100;
      purchase.paymentStatus = purchase.amountDue === 0 ? 'PAID' : 'PARTIAL';
      await purchase.save();

      allocatedPurchases.push({
        purchase: purchase._id,
        purchaseNumber: purchase.purchaseNumber,
        amountAllocated: allocation,
      });

      remainingToAllocate = Math.round((remainingToAllocate - allocation) * 100) / 100;
    }

    // Update supplier debt balance
    supplier.currentBalance = Math.round((supplier.currentBalance - payAmount) * 100) / 100;
    await supplier.save();

    const voucherNumber = await this.generateSupplierPaymentNumber();

    // Post Double-Entry Journal Entry:
    // DR 2010 Accounts Payable (Debt reduced)
    // CR 1010/1020 Cash/Bank (Money out)
    // NOTE: Does NOT touch operating expenses
    const journalEntry = await accountingService.postJournalEntry({
      reference: voucherNumber,
      description: `Supplier payment to ${supplier.name} (${voucherNumber})`,
      sourceModule: 'SUPPLIER_PAYMENT',
      sourceId: null,
      lines: [
        {
          accountCode: '2010',
          debit: payAmount,
          credit: 0,
          description: `Accounts Payable reduction for ${supplier.name}`,
        },
        {
          accountCode: sourceAccount.code,
          debit: 0,
          credit: payAmount,
          description: `Disbursed via ${paymentMethod} to ${supplier.name}`,
        },
      ],
      createdBy: userId,
    });

    const payment = new SupplierPayment({
      voucherNumber,
      supplier: supplier._id,
      amount: payAmount,
      paymentMethod,
      sourceAccount: sourceAccount._id,
      reference,
      notes,
      allocatedPurchases,
      paidBy: userId,
      journalEntry: journalEntry._id,
      date: new Date(),
    });

    await payment.save();

    return { payment, newSupplierBalance: supplier.currentBalance };
  }
}

module.exports = new DebtService();

