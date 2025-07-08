const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Refund'],
    required: true
  },
  cashierId: {
    type: String,
    required: true
  },
  cashierName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);