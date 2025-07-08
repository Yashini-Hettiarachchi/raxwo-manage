const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: [true, 'Item code is required'],
    unique: true,
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required']
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  buyingPrice: {
    type: Number,
    required: [true, 'Buying price is required'],
    min: [0, 'Price must be positive']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price must be positive']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    default: "Default Supplier"
  },
  // New Updated Values
  newBuyingPrice: {
    type: Number,
    min: [0, 'Price must be positive']
  },
  newSellingPrice: {
    type: Number,
    min: [0, 'Price must be positive']
  },
  newStock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  // Old Values
  oldStock: Number,
  oldBuyingPrice: Number,
  oldSellingPrice: Number,
  // Change history to track modifications
  changeHistory: [{
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changeType: { type: String, enum: ['create', 'update', 'delete', 'stock'], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);