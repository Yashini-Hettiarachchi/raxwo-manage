const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router();
const Product = require('../models/Product');
const ExcelProduct = require('../models/ExcelProduct');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET: Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Get all Excel upload logs
router.get('/excel-uploads', async (req, res) => {
  try {
    const logs = await ExcelProduct.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware: Function to get a product by ID with ObjectId validation
async function getProduct(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  let product;
  try {
    product = await Product.findById(req.params.id);
    if (product == null) {
      return res.status(404).json({ message: 'Cannot find product' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.product = product;
  next();
}

// GET: Get a single product by ID
router.get('/:id', getProduct, (req, res) => {
  res.json(res.product);
});

// POST: Create a new product
router.post('/', async (req, res) => {
  try {
    const existingProduct = await Product.findOne({ itemCode: req.body.itemCode });
    if (existingProduct) {
      return res.status(400).json({ message: "Item Code already exists. Please use a unique Item Code." });
    }

    const changeHistory = [{
      field: 'creation',
      oldValue: null,
      newValue: req.body,
      changedBy: req.body.changedBy || 'system',
      changedAt: new Date(),
      changeType: 'create'
    }];
    // If this is from Excel upload, add an addExpense log
    if (req.body.excelUpload) {
      changeHistory.push({
        field: 'stock',
        oldValue: 0,
        newValue: req.body.stock,
        changedBy: req.body.changedBy || 'system',
        changedAt: new Date(),
        changeType: 'addExpense'
      });
    }

    const product = new Product({
      itemCode: req.body.itemCode,
      itemName: req.body.itemName,
      category: req.body.category,
      buyingPrice: req.body.buyingPrice,
      sellingPrice: req.body.sellingPrice,
      stock: req.body.stock,
      supplierName: req.body.supplierName,
      changeHistory
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    // Check for MongoDB duplicate key error (code 11000)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.itemCode) {
      return res.status(400).json({ message: "Item Code already exists. Please use a unique Item Code." });
    }
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Update an existing product (partial update)
router.patch('/:id', getProduct, async (req, res) => {
  const updates = req.body;
  const changes = [];
  for (const [field, newValue] of Object.entries(updates)) {
    if (res.product[field] != newValue) {
      changes.push({
        field,
        oldValue: res.product[field],
        newValue,
        changedBy: req.body.changedBy || 'system',
        changedAt: new Date(),
        changeType: 'update'
      });
      res.product[field] = newValue;
    }
  }
  if (changes.length > 0) {
    res.product.changeHistory = [...(res.product.changeHistory || []), ...changes];
  }
  try {
    const updatedProduct = await res.product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Full update of a product by ID
router.put('/:id', getProduct, async (req, res) => {
  // List of updatable fields
  const updatableFields = [
    'itemCode', 'itemName', 'category', 'buyingPrice', 'sellingPrice', 'stock', 'supplierName',
    'newBuyingPrice', 'newSellingPrice', 'newStock',
    'oldStock', 'oldBuyingPrice', 'oldSellingPrice'
  ];

  // Check for itemCode uniqueness if changed
  if (req.body.itemCode && req.body.itemCode !== res.product.itemCode) {
    try {
      const existingProduct = await Product.findOne({ itemCode: req.body.itemCode });
      if (existingProduct) {
        return res.status(400).json({ message: 'GRN already exists. Please use a unique Item Code.' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Error checking item code: ' + err.message });
    }
  }

  // Replace all updatable fields
  const changes = [];
  for (const field of updatableFields) {
    if (req.body[field] !== undefined && res.product[field] !== req.body[field]) {
      changes.push({
        field,
        oldValue: res.product[field],
        newValue: req.body[field],
        changedBy: req.body.changedBy || 'system',
        changedAt: new Date(),
        changeType: 'update'
      });
      // If this is from Excel upload and field is stock, add addExpense log
      if (req.body.excelUpload && field === 'stock') {
        changes.push({
          field: 'stock',
          oldValue: res.product[field],
          newValue: req.body[field],
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'addExpense'
        });
      }
    }
  }
  if (changes.length > 0) {
    res.product.changeHistory = [...(res.product.changeHistory || []), ...changes];
  }

  try {
    const updatedProduct = await res.product.save();
    res.json(updatedProduct);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.itemCode) {
      return res.status(400).json({ message: 'GRN already exists. Please use a unique Item Code.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Remove a product
router.delete('/:id', getProduct, async (req, res) => {
  try {
    res.product.changeHistory = [...(res.product.changeHistory || []), {
      field: 'product',
      oldValue: JSON.stringify(res.product),
      newValue: null,
      changedBy: req.body.changedBy || 'system',
      changedAt: new Date(),
      changeType: 'delete'
    }];
    await res.product.save();
    await res.product.deleteOne();
    res.json({ message: 'Deleted Product' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Get a product by itemCode
router.get('/itemCode/:itemCode', async (req, res) => {
  try {
    const product = await Product.findOne({ itemCode: req.params.itemCode });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH: Update stock and price of an existing product or create new
router.patch('/update-stock/:itemCode', async (req, res) => {
  try {
    const itemCode = decodeURIComponent(req.params.itemCode);
    const { newStock, newBuyingPrice, newSellingPrice, itemName, category, supplierName } = req.body;

    // Validate required fields
    if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
      return res.status(400).json({ message: 'Item name is required and must be a non-empty string' });
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ message: 'Category is required and must be a non-empty string' });
    }
    if (newStock === undefined || newStock === null || newStock === '' || isNaN(Number(newStock)) || Number(newStock) < 0) {
      return res.status(400).json({ message: 'New stock is required and must be a non-negative number' });
    }
    if (newBuyingPrice === undefined || newBuyingPrice === null || newBuyingPrice === '' || isNaN(Number(newBuyingPrice)) || Number(newBuyingPrice) < 0) {
      return res.status(400).json({ message: 'New buying price is required and must be a non-negative number' });
    }
    if (newSellingPrice === undefined || newSellingPrice === null || newSellingPrice === '' || isNaN(Number(newSellingPrice)) || Number(newSellingPrice) < 0) {
      return res.status(400).json({ message: 'New selling price is required and must be a non-negative number' });
    }
    if (!supplierName || typeof supplierName !== 'string' || supplierName.trim() === '') {
      return res.status(400).json({ message: 'Supplier name is required and must be a non-empty string' });
    }

    let product = await Product.findOne({ itemCode });

    if (!product) {
      // Check if itemCode is already used by another product (double-check)
      const duplicateCheck = await Product.findOne({ itemCode });
      if (duplicateCheck) {
        return res.status(400).json({ message: "Item Code already exists. Please use a unique Item Code." });
      }

      // Create new product if it doesn't exist
      product = new Product({
        itemCode,
        itemName,
        category,
        buyingPrice: Number(newBuyingPrice),
        sellingPrice: Number(newSellingPrice),
        stock: Number(newStock),
        supplierName,
        changeHistory: [{
          field: 'creation',
          oldValue: null,
          newValue: { itemCode, itemName, category, buyingPrice: Number(newBuyingPrice), sellingPrice: Number(newSellingPrice), stock: Number(newStock), supplierName },
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'create'
        }]
      });
    } else {
      // Log stock change
      const changes = [];
      if (product.stock !== newStock) {
        changes.push({
          field: 'stock',
          oldValue: product.stock,
          newValue: newStock,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        });
      }
      if (product.buyingPrice !== newBuyingPrice) {
        changes.push({
          field: 'buyingPrice',
          oldValue: product.buyingPrice,
          newValue: newBuyingPrice,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        });
      }
      if (product.sellingPrice !== newSellingPrice) {
        changes.push({
          field: 'sellingPrice',
          oldValue: product.sellingPrice,
          newValue: newSellingPrice,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        });
      }
      if (changes.length > 0) {
        product.changeHistory = [...(product.changeHistory || []), ...changes];
      }
      // Update the stock and prices
      product.stock += Number(newStock);
      product.buyingPrice = Number(newBuyingPrice);
      product.sellingPrice = Number(newSellingPrice);
      product.supplierName = supplierName;
    }

    const updatedProduct = await product.save();
    res.json({ message: "Stock updated successfully", updatedProduct });
  } catch (err) {
    // Check for MongoDB duplicate key error (code 11000)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.itemCode) {
      return res.status(400).json({ message: "Item Code already exists. Please use a unique Item Code." });
    }
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Process product return
router.patch('/return/:id', async (req, res) => {
  try {
    const { returnQuantity, returnType } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const quantity = Number(returnQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.error('Invalid return quantity:', returnQuantity);
      return res.status(400).json({ message: 'Invalid return quantity' });
    }

    if (returnType === 'out-stock') {
      if (product.stock < quantity) {
        console.error('Return quantity exceeds available stock:', quantity);
        return res.status(400).json({ message: 'Return quantity exceeds available stock' });
      }
      // Log stock change before reducing
      product.changeHistory = [
        ...(product.changeHistory || []),
        {
          field: 'stock',
          oldValue: product.stock,
          newValue: product.stock - quantity,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        }
      ];
      product.stock -= quantity; // Reduce stock
    }

    const updatedProduct = await product.save();
    res.json({ message: 'Product return processed', updatedProduct });
  } catch (err) {
    console.error('Error processing return:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST: Bulk upload products from Excel file
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or has no data' });
    }

    const username = req.body.uploadedBy || 'system';
    const results = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Extract data from Excel row
        const itemName = row['Item Name'] || row['itemName'] || row['ItemName'];
        const category = row['Category'] || row['category'];
        const buyingPrice = parseFloat(String(row['Buying Price'] || row['buyingPrice'] || row['BuyingPrice'] || 0).replace(/Rs\.?\s*/, ''));
        const sellingPrice = parseFloat(String(row['Selling Price'] || row['sellingPrice'] || row['SellingPrice'] || 0).replace(/Rs\.?\s*/, ''));
        const stock = parseInt(row['Stock'] || row['stock'] || 0, 10);
        const supplierName = row['Supplier'] || row['supplierName'] || row['SupplierName'];
        const itemCode = row['Item Code'] || row['itemCode'] || row['ItemCode'] || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        if (!itemName) {
          errors.push({ row: i + 1, error: 'Item Name is required' });
          continue;
        }

        // Check if product exists by itemName
        let existingProduct = await Product.findOne({ itemName: itemName });
        
        if (existingProduct) {
          // Update existing product
          const changes = [];
          if (existingProduct.stock !== stock) {
            changes.push({
              field: 'stock',
              oldValue: existingProduct.stock,
              newValue: stock,
              changedBy: username,
              changedAt: new Date(),
              changeType: 'update'
            });
          }
          if (existingProduct.buyingPrice !== buyingPrice) {
            changes.push({
              field: 'buyingPrice',
              oldValue: existingProduct.buyingPrice,
              newValue: buyingPrice,
              changedBy: username,
              changedAt: new Date(),
              changeType: 'update'
            });
          }
          if (existingProduct.sellingPrice !== sellingPrice) {
            changes.push({
              field: 'sellingPrice',
              oldValue: existingProduct.sellingPrice,
              newValue: sellingPrice,
              changedBy: username,
              changedAt: new Date(),
              changeType: 'update'
            });
          }
          if (existingProduct.category !== category) {
            changes.push({
              field: 'category',
              oldValue: existingProduct.category,
              newValue: category,
              changedBy: username,
              changedAt: new Date(),
              changeType: 'update'
            });
          }
          if (existingProduct.supplierName !== supplierName) {
            changes.push({
              field: 'supplierName',
              oldValue: existingProduct.supplierName,
              newValue: supplierName,
              changedBy: username,
              changedAt: new Date(),
              changeType: 'update'
            });
          }

          if (changes.length > 0) {
            existingProduct.changeHistory = [...(existingProduct.changeHistory || []), ...changes];
          }

          existingProduct.stock = stock;
          existingProduct.buyingPrice = buyingPrice;
          existingProduct.sellingPrice = sellingPrice;
          existingProduct.category = category;
          existingProduct.supplierName = supplierName;

          await existingProduct.save();
          results.push({ action: 'updated', itemName, itemCode: existingProduct.itemCode });
        } else {
          // Create new product
          const changeHistory = [{
            field: 'creation',
            oldValue: null,
            newValue: { itemName, category, buyingPrice, sellingPrice, stock, supplierName },
            changedBy: username,
            changedAt: new Date(),
            changeType: 'create'
          }];

          const newProduct = new Product({
            itemCode,
            itemName,
            category,
            buyingPrice,
            sellingPrice,
            stock,
            supplierName,
            changeHistory
          });

          await newProduct.save();
          results.push({ action: 'created', itemName, itemCode });
        }
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    // Log the upload
    try {
      const log = new ExcelProduct({
        filename: req.file.originalname,
        uploadedBy: username,
        products: results
      });
      await log.save();
    } catch (logError) {
      console.error('Error logging Excel upload:', logError);
    }

    res.json({
      message: 'Excel upload completed',
      totalProcessed: jsonData.length,
      successful: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Excel upload error:', error);
    res.status(500).json({ message: 'Error processing Excel file: ' + error.message });
  }
});

// POST: Log Excel upload
router.post('/excel-upload-log', async (req, res) => {
  try {
    console.log('Received Excel upload log:', req.body); // Debug log
    const { filename, uploadedBy, products } = req.body;
    if (!filename || !uploadedBy || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Missing required fields for Excel upload log.' });
    }
    const log = new ExcelProduct({ filename, uploadedBy, products });
    await log.save();
    res.status(201).json({ message: 'Excel upload logged successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Backfill stock changeHistory for all products
router.post('/backfill-stock-history', async (req, res) => {
  try {
    const products = await Product.find();
    let updatedCount = 0;
    for (const product of products) {
      let history = product.changeHistory || [];
      let prevStock = null;
      let newHistory = [];
      // Find the initial stock value
      if (history.length > 0 && history[0].field === 'creation' && history[0].newValue && history[0].newValue.stock !== undefined) {
        prevStock = history[0].newValue.stock;
      } else if (product.stock !== undefined) {
        prevStock = product.stock;
      }
      for (let i = 0; i < history.length; i++) {
        const log = history[i];
        if (log.field === 'stock' && log.changeType !== 'update') {
          // Convert old stock logs to 'update'
          newHistory.push({ ...log, changeType: 'update' });
          prevStock = log.newValue;
        } else if (log.field === 'stock') {
          newHistory.push(log);
          prevStock = log.newValue;
        } else {
          newHistory.push(log);
        }
        // If the next log is not a stock change, but the stock value changed, add a synthetic log
        if (i < history.length - 1 && history[i + 1].field !== 'stock' && product.stock !== prevStock) {
          newHistory.push({
            field: 'stock',
            oldValue: prevStock,
            newValue: product.stock,
            changedBy: 'system-backfill',
            changedAt: new Date(),
            changeType: 'update'
          });
          prevStock = product.stock;
        }
      }
      // If no stock change logs exist but stock changed from initial, add one
      if (!history.some(log => log.field === 'stock') && prevStock !== product.stock) {
        newHistory.push({
          field: 'stock',
          oldValue: prevStock,
          newValue: product.stock,
          changedBy: 'system-backfill',
          changedAt: new Date(),
          changeType: 'update'
        });
      }
      product.changeHistory = newHistory;
      await product.save();
      updatedCount++;
    }
    res.json({ message: `Backfilled stock changeHistory for ${updatedCount} products.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;