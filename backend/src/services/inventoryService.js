const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const accountingService = require('./accountingService');

class InventoryService {
  /**
   * Records a stock movement and updates product stock level and weighted average cost
   */
  async recordMovement({
    productId,
    movementType,
    quantityIn = 0,
    quantityOut = 0,
    unitCost = null,
    referenceType = '',
    referenceId = null,
    referenceNumber = '',
    reason = '',
    userId = null,
  }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const previousStock = product.currentStock;
    let resultingStock = previousStock + quantityIn - quantityOut;

    if (resultingStock < 0) {
      throw new Error(
        `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${previousStock}, Requested: ${quantityOut}`
      );
    }

    let finalUnitCost = unitCost !== null ? unitCost : product.purchaseCost;

    // Moving Weighted Average Cost (AVCO) recalculation on purchase receipt
    if (movementType === 'PURCHASE_RECEIVE' && quantityIn > 0 && unitCost !== null) {
      const currentValuation = previousStock * product.purchaseCost;
      const incomingValuation = quantityIn * unitCost;
      const totalNewQuantity = previousStock + quantityIn;

      if (totalNewQuantity > 0) {
        product.purchaseCost = Math.round(((currentValuation + incomingValuation) / totalNewQuantity) * 100) / 100;
        finalUnitCost = product.purchaseCost;
      }
    }

    product.currentStock = Math.round(resultingStock * 100) / 100;
    await product.save();

    const movement = new InventoryMovement({
      product: product._id,
      movementType,
      quantityIn,
      quantityOut,
      unitCost: finalUnitCost,
      totalCost: Math.round((quantityIn > 0 ? quantityIn * finalUnitCost : quantityOut * finalUnitCost) * 100) / 100,
      previousStock,
      resultingStock: product.currentStock,
      referenceType,
      referenceId,
      referenceNumber,
      reason,
      user: userId,
      date: new Date(),
    });

    await movement.save();
    return { product, movement };
  }

  /**
   * Adjusts stock due to count reconciliation, damage, or loss
   */
  async adjustStock({ productId, adjustmentType, quantity, reason, userId }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found`);
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    let movementType = 'STOCK_ADJUSTMENT';
    let qtyIn = 0;
    let qtyOut = 0;

    if (adjustmentType === 'INCREASE') {
      qtyIn = qty;
    } else if (adjustmentType === 'DECREASE' || adjustmentType === 'DAMAGED_WRITE_OFF') {
      qtyOut = qty;
      movementType = adjustmentType === 'DAMAGED_WRITE_OFF' ? 'DAMAGED_WRITE_OFF' : 'STOCK_ADJUSTMENT';
    } else {
      throw new Error(`Invalid adjustment type: ${adjustmentType}`);
    }

    const { movement } = await this.recordMovement({
      productId: product._id,
      movementType,
      quantityIn: qtyIn,
      quantityOut: qtyOut,
      unitCost: product.purchaseCost,
      referenceType: 'StockAdjustment',
      reason: reason || `Manual adjustment: ${adjustmentType}`,
      userId,
    });

    // Accounting post: If damaged or written off, recognize loss in COGS/Loss account
    if (movementType === 'DAMAGED_WRITE_OFF' || (adjustmentType === 'DECREASE' && reason?.toLowerCase().includes('damage'))) {
      const lossAmount = Math.round(qtyOut * product.purchaseCost * 100) / 100;
      if (lossAmount > 0) {
        await accountingService.postJournalEntry({
          reference: `ADJ-${product.sku}`,
          description: `Inventory write-off: ${qtyOut} ${product.unit} of ${product.name} (${reason})`,
          sourceModule: 'INVENTORY_ADJUSTMENT',
          sourceId: movement._id,
          lines: [
            { accountCode: '5020', debit: lossAmount, credit: 0, description: 'Inventory Shrinkage & Loss' },
            { accountCode: '1300', debit: 0, credit: lossAmount, description: 'Inventory Asset reduction' },
          ],
          createdBy: userId,
        });
      }
    }

    return movement;
  }

  /**
   * Retrieves low stock products
   */
  async getLowStockProducts() {
    return await Product.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      status: 'ACTIVE',
    })
      .populate('category', 'name')
      .sort({ currentStock: 1 });
  }

  /**
   * Retrieves overall inventory valuation report
   */
  async getValuationReport() {
    const products = await Product.find({ status: 'ACTIVE' }).populate('category', 'name');

    let totalItemsCount = 0;
    let totalStockQuantity = 0;
    let totalInventoryValue = 0;
    let totalPotentialSalesValue = 0;

    const breakdown = products.map((p) => {
      const stockValuation = Math.round(p.currentStock * p.purchaseCost * 100) / 100;
      const salesValuation = Math.round(p.currentStock * p.sellingPrice * 100) / 100;

      totalItemsCount += 1;
      totalStockQuantity += p.currentStock;
      totalInventoryValue += stockValuation;
      totalPotentialSalesValue += salesValuation;

      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category ? p.category.name : 'Uncategorized',
        unit: p.unit,
        currentStock: p.currentStock,
        minStockLevel: p.minStockLevel,
        purchaseCost: p.purchaseCost,
        sellingPrice: p.sellingPrice,
        valuation: stockValuation,
        potentialSalesValue: salesValuation,
        marginPercentage:
          p.sellingPrice > 0
            ? Math.round(((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 10000) / 100
            : 0,
      };
    });

    return {
      totalItemsCount,
      totalStockQuantity,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalPotentialSalesValue: Math.round(totalPotentialSalesValue * 100) / 100,
      estimatedGrossProfit: Math.round((totalPotentialSalesValue - totalInventoryValue) * 100) / 100,
      products: breakdown,
    };
  }
}

module.exports = new InventoryService();

