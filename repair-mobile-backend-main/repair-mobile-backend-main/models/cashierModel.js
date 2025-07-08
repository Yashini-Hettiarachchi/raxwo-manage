const mongoose = require("mongoose");

const cashierSchema = new mongoose.Schema(
  {
    cashierName: { type: String, required: true },
    phone: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    id: { type: String, required: true, unique: true },
    jobRole: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cashier", cashierSchema);