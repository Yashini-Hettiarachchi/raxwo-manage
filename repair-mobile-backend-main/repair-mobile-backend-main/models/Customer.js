const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  nic: { type: String, required: true },
  customerName: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['Credit', 'Wholesale'], required: true },
  items: [
    {
      itemName: String,
      quantity: Number,
      price: Number,
      discount: Number,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
