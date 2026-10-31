const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryMovement = require('../models/InventoryMovement');
const inventoryService = require('../services/inventoryService');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'DISCONTINUED' };
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).populate('category', 'name').sort({ name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      description,
      unit,
      purchaseCost,
      sellingPrice,
      initialStock = 0,
      minStockLevel = 5,
      location,
    } = req.body;

    const product = new Product({
      name,
      sku: sku.toUpperCase().trim(),
      barcode: barcode ? barcode.trim() : undefined,
      category,
      description,
      unit: unit || 'pcs',
      purchaseCost: Number(purchaseCost || 0),
      sellingPrice: Number(sellingPrice || 0),
      currentStock: 0,
      minStockLevel: Number(minStockLevel || 5),
      location,
    });

    await product.save();

    // If initial stock provided, record opening stock movement
    if (Number(initialStock) > 0) {
      await inventoryService.recordMovement({
        productId: product._id,
        movementType: 'OPENING_STOCK',
        quantityIn: Number(initialStock),
        quantityOut: 0,
        unitCost: Number(purchaseCost || 0),
        reason: 'Initial inventory count',
        userId: req.user._id,
      });
    }

    const populatedProduct = await Product.findById(product._id).populate('category', 'name');
    res.status(201).json({ success: true, data: populatedProduct });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { name, barcode, category, description, unit, sellingPrice, minStockLevel, location, status } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name) product.name = name;
    if (barcode !== undefined) product.barcode = barcode;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (unit) product.unit = unit;
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minStockLevel !== undefined) product.minStockLevel = Number(minStockLevel);
    if (location !== undefined) product.location = location;
    if (status) product.status = status;

    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { adjustmentType, quantity, reason } = req.body;
    const movement = await inventoryService.adjustStock({
      productId: req.params.id,
      adjustmentType,
      quantity,
      reason,
      userId: req.user._id,
    });

    const updatedProduct = await Product.findById(req.params.id).populate('category', 'name');
    res.json({ success: true, data: { movement, product: updatedProduct } });
  } catch (err) {
    next(err);
  }
};

exports.getInventoryMovements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.params.id) {
      filter.product = req.params.id;
    }

    const movements = await InventoryMovement.find(filter)
      .populate('product', 'name sku')
      .populate('user', 'name')
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, count: movements.length, data: movements });
  } catch (err) {
    next(err);
  }
};

exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStock = await inventoryService.getLowStockProducts();
    res.json({ success: true, count: lowStock.length, data: lowStock });
  } catch (err) {
    next(err);
  }
};

exports.getValuation = async (req, res, next) => {
  try {
    const valuation = await inventoryService.getValuationReport();
    res.json({ success: true, data: valuation });
  } catch (err) {
    next(err);
  }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const category = await Category.create({
      name,
      code: code ? code.toUpperCase() : name.slice(0, 3).toUpperCase(),
      description,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

