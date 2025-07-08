const mongoose = require('mongoose');

const excelProductSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  products: [
    {
      itemCode: String,
      itemName: String,
      action: { type: String, enum: ['created', 'updated'], required: true }
    }
  ]
});

module.exports = mongoose.model('ExcelProduct', excelProductSchema); 