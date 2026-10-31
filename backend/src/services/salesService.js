const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const CashierShift = require('../models/CashierShift');
const inventoryService = require('./inventoryService');
const accountingService = require('./accountingService');

class SalesService {
  async generateInvoiceNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await Sale.countDocuments();
    return `INV-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Process a complete retail or wholesale sale transaction
   */
  async createSale({
    customerId = null,
    customerName = 'Walk-in Customer',
    customerPhone = '',
    cashierId,
    cashierName,
    items,
    discountTotal = 0,
    taxRate = 0,
    paymentMethod = 'CASH',
    payments = [],
    notes = '',
  }) {
    if (!items || items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    // 1. Validate Customer if Credit is involved
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      customerName = customer.name;
      customerPhone = customer.phone || customerPhone;
    }

    // 2. Validate Stock and Build Sale Line Items with locked historical costs
    let subtotal = 0;
    let totalCostOfGoodsSold = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.status !== 'ACTIVE') {
        throw new Error(`Product "${product.name}" is not active`);
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        throw new Error(`Quantity for "${product.name}" must be greater than zero`);
      }

      if (product.currentStock < qty) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${qty}`
        );
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
      const discount = Number(item.discount || 0);
      const lineSubtotal = Math.round((qty * unitPrice - discount) * 100) / 100;
      const historicalCost = product.purchaseCost;
      const lineCOGS = Math.round(qty * historicalCost * 100) / 100;

      subtotal += lineSubtotal;
      totalCostOfGoodsSold += lineCOGS;

      processedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice,
        historicalCost,
        discount,
        subtotal: lineSubtotal,
        totalCostOfGoodsSold: lineCOGS,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    discountTotal = Math.round(Number(discountTotal || 0) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxTotal = Math.round(taxableAmount * Number(taxRate || 0) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxTotal) * 100) / 100;

    // 3. Process Payments (Cash, Bank, Mobile Money, Credit, or Split)
    let amountPaid = 0;
    const paymentRecords = [];

    if (paymentMethod === 'CREDIT') {
      amountPaid = 0;
    } else if (paymentMethod === 'SPLIT' && payments.length > 0) {
      for (const p of payments) {
        const amt = Math.round(Number(p.amount) * 100) / 100;
        if (amt > 0) {
          amountPaid += amt;
          paymentRecords.push({
            method: p.method,
            amount: amt,
            account: p.accountId || null,
            reference: p.reference || '',
          });
        }
      }
    } else {
      // Standard full or partial immediate payment
      amountPaid = Math.round(Number(payments[0]?.amount ?? totalAmount) * 100) / 100;
      paymentRecords.push({
        method: paymentMethod,
        amount: Math.min(amountPaid, totalAmount),
        reference: payments[0]?.reference || '',
      });
    }

    amountPaid = Math.min(amountPaid, totalAmount);
    const amountDue = Math.round((totalAmount - amountPaid) * 100) / 100;

    if (amountDue > 0 && !customer) {
      throw new Error('Credit sales or partial payments require selecting a registered customer');
    }

    if (amountDue > 0 && customer) {
      if (customer.creditLimit > 0 && customer.currentBalance + amountDue > customer.creditLimit) {
        throw new Error(
          `Customer credit limit exceeded! Limit: $${customer.creditLimit}, Current Debt: $${customer.currentBalance}, New Debt: $${amountDue}`
        );
      }
    }

    const paymentStatus = amountDue === 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
    const invoiceNumber = await this.generateInvoiceNumber();

    // Check active cashier shift
    const activeShift = await CashierShift.findOne({
      cashier: cashierId,
      status: 'OPEN',
    });

    const sale = new Sale({
      invoiceNumber,
      customer: customer ? customer._id : null,
      customerName,
      customerPhone,
      cashier: cashierId,
      cashierName,
      saleDate: new Date(),
      items: processedItems,
      subtotal,
      discountTotal,
      taxRate,
      taxTotal,
      totalAmount,
      totalCostOfGoodsSold,
      amountPaid,
      amountDue,
      paymentStatus,
      paymentMethod,
      payments: paymentRecords,
      status: 'COMPLETED',
      shiftId: activeShift ? activeShift._id : null,
      notes,
    });

    await sale.save();

    // 4. Update Inventory Movements for each item
    for (const item of processedItems) {
      await inventoryService.recordMovement({
        productId: item.product,
        movementType: 'SALE',
        quantityIn: 0,
        quantityOut: item.quantity,
        unitCost: item.historicalCost,
        referenceType: 'Sale',
        referenceId: sale._id,
        referenceNumber: invoiceNumber,
        reason: `Sold on invoice ${invoiceNumber}`,
        userId: cashierId,
      });
    }

    // 5. Update Customer Balance if credit sale
    if (amountDue > 0 && customer) {
      customer.currentBalance = Math.round((customer.currentBalance + amountDue) * 100) / 100;
      await customer.save();
    }

    // 6. Update Cashier Shift if cash received
    let totalCashReceived = 0;
    if (paymentMethod === 'CASH') {
      totalCashReceived = amountPaid;
    } else if (paymentMethod === 'SPLIT') {
      const cashEntry = paymentRecords.find((p) => p.method === 'CASH');
      if (cashEntry) totalCashReceived = cashEntry.amount;
    }

    if (activeShift && totalCashReceived > 0) {
      activeShift.totalCashSales = Math.round((activeShift.totalCashSales + totalCashReceived) * 100) / 100;
      activeShift.expectedClosingCash =
        Math.round((activeShift.openingCash + activeShift.totalCashSales + activeShift.totalDebtCollections - activeShift.totalCashPayouts) * 100) / 100;
      await activeShift.save();
    }

    // 7. Post Double-Entry Journal Entry
    // Lines:
    // DR Cash/Bank/M-Pesa for amount paid
    // DR 1200 Accounts Receivable for amount due
    // DR 4030 Sales Discounts (if any)
    // CR 4010 Sales Revenue (taxable base + discount)
    // CR 2050 Sales Tax Payable (if tax collected)
    // DR 5010 Cost of Goods Sold
    // CR 1300 Inventory Asset
    const journalLines = [];

    // Payments debits
    if (amountPaid > 0) {
      if (paymentMethod === 'SPLIT') {
        for (const p of paymentRecords) {
          const accCode = p.method === 'BANK_TRANSFER' ? '1020' : p.method === 'MOBILE_MONEY' ? '1030' : '1010';
          journalLines.push({
            accountCode: accCode,
            debit: p.amount,
            credit: 0,
            description: `Payment for ${invoiceNumber} via ${p.method}`,
          });
        }
      } else {
        const accCode = paymentMethod === 'BANK_TRANSFER' ? '1020' : paymentMethod === 'MOBILE_MONEY' ? '1030' : '1010';
        journalLines.push({
          accountCode: accCode,
          debit: amountPaid,
          credit: 0,
          description: `Payment for ${invoiceNumber} via ${paymentMethod}`,
        });
      }
    }

    if (amountDue > 0) {
      journalLines.push({
        accountCode: '1200',
        debit: amountDue,
        credit: 0,
        description: `Receivable from ${customerName} for ${invoiceNumber}`,
      });
    }

    if (discountTotal > 0) {
      journalLines.push({
        accountCode: '4030',
        debit: discountTotal,
        credit: 0,
        description: `Discount on ${invoiceNumber}`,
      });
    }

    // Revenue credits
    journalLines.push({
      accountCode: '4010',
      debit: 0,
      credit: subtotal,
      description: `Sales revenue for ${invoiceNumber}`,
    });

    if (taxTotal > 0) {
      journalLines.push({
        accountCode: '2050',
        debit: 0,
        credit: taxTotal,
        description: `Sales tax for ${invoiceNumber}`,
      });
    }

    // COGS and Inventory postings
    if (totalCostOfGoodsSold > 0) {
      journalLines.push({
        accountCode: '5010',
        debit: totalCostOfGoodsSold,
        credit: 0,
        description: `COGS for ${invoiceNumber}`,
      });
      journalLines.push({
        accountCode: '1300',
        debit: 0,
        credit: totalCostOfGoodsSold,
        description: `Inventory reduction for ${invoiceNumber}`,
      });
    }

    const journalEntry = await accountingService.postJournalEntry({
      reference: invoiceNumber,
      description: `Sale invoice ${invoiceNumber} (${customerName})`,
      sourceModule: 'SALES',
      sourceId: sale._id,
      lines: journalLines,
      createdBy: cashierId,
    });

    sale.journalEntry = journalEntry._id;
    await sale.save();

    return sale;
  }

  /**
   * Process customer returns on a sale
   */
  async processReturn({ saleId, returnedItems, refundMethod = 'CASH', reason = '', userId }) {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }
    if (sale.status === 'RETURNED' || sale.status === 'CANCELLED') {
      throw new Error(`Sale is already marked as ${sale.status}`);
    }

    let refundAmount = 0;
    let reversedCOGS = 0;

    for (const ret of returnedItems) {
      const originalItem = sale.items.find((i) => i.product.toString() === ret.productId.toString());
      if (!originalItem) {
        throw new Error(`Product not part of original invoice`);
      }
      if (ret.quantity > originalItem.quantity) {
        throw new Error(`Cannot return more items than purchased (${originalItem.quantity})`);
      }

      const itemRefund = Math.round(ret.quantity * originalItem.unitPrice * 100) / 100;
      const itemCOGS = Math.round(ret.quantity * originalItem.historicalCost * 100) / 100;

      refundAmount += itemRefund;
      reversedCOGS += itemCOGS;

      // Restock item
      await inventoryService.recordMovement({
        productId: originalItem.product,
        movementType: 'CUSTOMER_RETURN',
        quantityIn: ret.quantity,
        quantityOut: 0,
        unitCost: originalItem.historicalCost,
        referenceType: 'SaleReturn',
        referenceId: sale._id,
        referenceNumber: sale.invoiceNumber,
        reason: reason || 'Customer return',
        userId,
      });
    }

    refundAmount = Math.round(refundAmount * 100) / 100;
    reversedCOGS = Math.round(reversedCOGS * 100) / 100;

    // Journal Entry for return
    // DR 4020 Sales Returns & Allowances
    // CR Cash / Bank / Accounts Receivable
    // DR 1300 Inventory Asset
    // CR 5010 Cost of Goods Sold
    const lines = [
      {
        accountCode: '4020',
        debit: refundAmount,
        credit: 0,
        description: `Customer return on ${sale.invoiceNumber}`,
      },
      {
        accountCode: refundMethod === 'BANK_TRANSFER' ? '1020' : refundMethod === 'CREDIT' ? '1200' : '1010',
        debit: 0,
        credit: refundAmount,
        description: `Refund for return on ${sale.invoiceNumber}`,
      },
    ];

    if (reversedCOGS > 0) {
      lines.push({
        accountCode: '1300',
        debit: reversedCOGS,
        credit: 0,
        description: `Inventory reinstated from return on ${sale.invoiceNumber}`,
      });
      lines.push({
        accountCode: '5010',
        debit: 0,
        credit: reversedCOGS,
        description: `COGS reversed from return on ${sale.invoiceNumber}`,
      });
    }

    const returnJE = await accountingService.postJournalEntry({
      reference: `RET-${sale.invoiceNumber}`,
      description: `Sales Return on ${sale.invoiceNumber}: ${reason}`,
      sourceModule: 'SALES_RETURN',
      sourceId: sale._id,
      lines,
      createdBy: userId,
    });

    // Update customer debt if refund is credit
    if (refundMethod === 'CREDIT' && sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.currentBalance = Math.max(0, Math.round((customer.currentBalance - refundAmount) * 100) / 100);
        await customer.save();
      }
    }

    sale.status = 'RETURNED';
    await sale.save();

    return { sale, returnJE, refundAmount };
  }
}

module.exports = new SalesService();

