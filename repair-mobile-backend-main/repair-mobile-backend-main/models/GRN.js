const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  buyingPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
});

const grnSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  date: { type: Date, required: true },
  items: [grnItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.models.GRN || mongoose.model('GRN', grnSchema); 