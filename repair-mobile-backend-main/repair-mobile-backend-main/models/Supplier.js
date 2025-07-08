const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  buyingPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  supplierName: { type: String, required: true },
});

const supplierSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  businessName: { type: String, required: false },
  supplierName: { 
    type: String, 
    required: [true, 'Supplier name is required'],
    unique: true,
  },
  phoneNumber: { type: String, required: false },
  address: { type: String, required: false },
  receiptNumber: { 
    type: String, 
    required: false
  },
  totalPayments: { 
    type: Number, 
    required: false, 
    default: 0, 
    min: 0 
  },
  items: [itemSchema],
  // Change history to track modifications
  changeHistory: [{
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changeType: { type: String, enum: ['create', 'update', 'delete', 'cart'], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);