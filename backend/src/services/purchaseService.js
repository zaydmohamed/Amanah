const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const inventoryService = require('./inventoryService');
const accountingService = require('./accountingService');

class PurchaseService {
  async generatePurchaseNumber() {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await Purchase.countDocuments();
    return `PO-${datePrefix}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Create a purchase order (Draft or Ordered) - Does NOT touch stock yet
   */
  async createPurchaseOrder({
    supplierId,
    items,
    additionalCosts = 0,
    expectedDeliveryDate = null,
    notes = '',
    paymentMethod = 'CREDIT',
    amountPaid = 0,
    paymentAccountId = null,
    createdBy,
  }) {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (!items || items.length === 0) {
      throw new Error('Purchase must contain at least one product item');
    }

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const qty = Number(item.orderedQuantity);
      const unitCost = Number(item.unitCost);

      if (qty <= 0 || unitCost < 0) {
        throw new Error(`Invalid quantity or cost for product "${product.name}"`);
      }

      const lineSubtotal = Math.round(qty * unitCost * 100) / 100;
      subtotal += lineSubtotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        orderedQuantity: qty,
        receivedQuantity: 0,
        unitCost,
        subtotal: lineSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    additionalCosts = Math.round(Number(additionalCosts || 0) * 100) / 100;
    const totalAmount = Math.round((subtotal + additionalCosts) * 100) / 100;

    amountPaid = Math.min(Math.round(Number(amountPaid || 0) * 100) / 100, totalAmount);
    const amountDue = Math.round((totalAmount - amountPaid) * 100) / 100;
    const paymentStatus = amountDue === 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const purchaseNumber = await this.generatePurchaseNumber();

    const purchase = new Purchase({
      purchaseNumber,
      supplier: supplier._id,
      purchaseDate: new Date(),
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      additionalCosts,
      totalAmount,
      amountPaid,
      amountDue,
      paymentStatus,
      status: 'ORDERED', // Physical stock is not received yet
      paymentMethod,
      paymentAccount: paymentAccountId,
      createdBy,
      notes,
    });

    await purchase.save();
    return purchase;
  }

  /**
   * Receive physical goods for a purchase order - Increases stock and posts to ledger
   */
  async receivePurchase({ purchaseId, receivedItems, userId }) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new Error('Purchase order not found');
    }
    if (purchase.status === 'RECEIVED') {
      throw new Error('Goods have already been received for this purchase');
    }

    const supplier = await Supplier.findById(purchase.supplier);
    if (!supplier) {
      throw new Error('Supplier record not found');
    }

    let actualReceivedTotal = 0;

    // Process each item received
    for (const item of purchase.items) {
      // Find matching item from input, or default to all ordered quantity
      const match = receivedItems ? receivedItems.find((r) => r.productId.toString() === item.product.toString()) : null;
      const qtyToReceive = match ? Number(match.receivedQuantity) : item.orderedQuantity;

      item.receivedQuantity = qtyToReceive;
      const lineCost = Math.round(qtyToReceive * item.unitCost * 100) / 100;
      actualReceivedTotal += lineCost;

      // Update physical inventory and recalculate moving weighted average cost
      await inventoryService.recordMovement({
        productId: item.product,
        movementType: 'PURCHASE_RECEIVE',
        quantityIn: qtyToReceive,
        quantityOut: 0,
        unitCost: item.unitCost,
        referenceType: 'Purchase',
        referenceId: purchase._id,
        referenceNumber: purchase.purchaseNumber,
        reason: `Received purchase order ${purchase.purchaseNumber}`,
        userId,
      });
    }

    actualReceivedTotal = Math.round((actualReceivedTotal + purchase.additionalCosts) * 100) / 100;
    purchase.status = 'RECEIVED';
    purchase.receivedDate = new Date();

    // Update supplier debt if on credit / unpaid balance
    if (purchase.amountDue > 0) {
      supplier.currentBalance = Math.round((supplier.currentBalance + purchase.amountDue) * 100) / 100;
      await supplier.save();
    }

    // Post Double-Entry Journal Entry:
    // DR 1300 Inventory Asset (total inventory value received)
    // CR 1010/1020 Cash/Bank (amount paid upfront, if any)
    // CR 2010 Accounts Payable (unpaid debt owed to supplier)
    const journalLines = [
      {
        accountCode: '1300',
        debit: purchase.totalAmount,
        credit: 0,
        description: `Inventory received on ${purchase.purchaseNumber}`,
      },
    ];

    if (purchase.amountPaid > 0) {
      const paymentCode = purchase.paymentMethod === 'BANK_TRANSFER' ? '1020' : '1010';
      journalLines.push({
        accountCode: paymentCode,
        debit: 0,
        credit: purchase.amountPaid,
        description: `Upfront payment for ${purchase.purchaseNumber}`,
      });
    }

    if (purchase.amountDue > 0) {
      journalLines.push({
        accountCode: '2010',
        debit: 0,
        credit: purchase.amountDue,
        description: `Accounts Payable to ${supplier.name} for ${purchase.purchaseNumber}`,
      });
    }

    const journalEntry = await accountingService.postJournalEntry({
      reference: purchase.purchaseNumber,
      description: `Purchase receiving: ${purchase.purchaseNumber} from ${supplier.name}`,
      sourceModule: 'PURCHASES',
      sourceId: purchase._id,
      lines: journalLines,
      createdBy: userId,
    });

    purchase.journalEntry = journalEntry._id;
    await purchase.save();

    return purchase;
  }

  /**
   * Return goods to supplier
   */
  async returnToSupplier({ purchaseId, returnedItems, reason = '', refundType = 'CREDIT_REDUCTION', userId }) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new Error('Purchase not found');
    }
    if (purchase.status !== 'RECEIVED') {
      throw new Error('Can only return purchases that have been received into stock');
    }

    const supplier = await Supplier.findById(purchase.supplier);
    let totalReturnAmount = 0;

    for (const ret of returnedItems) {
      const originalItem = purchase.items.find((i) => i.product.toString() === ret.productId.toString());
      if (!originalItem) {
        throw new Error('Product not found in this purchase');
      }

      const returnQty = Number(ret.quantity);
      if (returnQty > originalItem.receivedQuantity) {
        throw new Error(`Cannot return more items than received (${originalItem.receivedQuantity})`);
      }

      const returnVal = Math.round(returnQty * originalItem.unitCost * 100) / 100;
      totalReturnAmount += returnVal;

      // Remove from physical stock
      await inventoryService.recordMovement({
        productId: originalItem.product,
        movementType: 'SUPPLIER_RETURN',
        quantityIn: 0,
        quantityOut: returnQty,
        unitCost: originalItem.unitCost,
        referenceType: 'SupplierReturn',
        referenceId: purchase._id,
        referenceNumber: purchase.purchaseNumber,
        reason: reason || 'Returned to supplier',
        userId,
      });
    }

    totalReturnAmount = Math.round(totalReturnAmount * 100) / 100;

    // Journal Entry for Supplier Return:
    // DR 2010 Accounts Payable (reducing liability) or Cash if refunded
    // CR 1300 Inventory Asset
    const lines = [
      {
        accountCode: refundType === 'CASH' ? '1010' : '2010',
        debit: totalReturnAmount,
        credit: 0,
        description: `Supplier return on ${purchase.purchaseNumber}`,
      },
      {
        accountCode: '1300',
        debit: 0,
        credit: totalReturnAmount,
        description: `Inventory returned to ${supplier.name}`,
      },
    ];

    const returnJE = await accountingService.postJournalEntry({
      reference: `SRET-${purchase.purchaseNumber}`,
      description: `Supplier Return: ${purchase.purchaseNumber} (${supplier.name})`,
      sourceModule: 'SUPPLIER_RETURN',
      sourceId: purchase._id,
      lines,
      createdBy: userId,
    });

    // Update supplier debt if credit reduction
    if (refundType === 'CREDIT_REDUCTION') {
      supplier.currentBalance = Math.max(0, Math.round((supplier.currentBalance - totalReturnAmount) * 100) / 100);
      await supplier.save();
    }

    return { purchase, returnJE, totalReturnAmount };
  }
}

module.exports = new PurchaseService();

