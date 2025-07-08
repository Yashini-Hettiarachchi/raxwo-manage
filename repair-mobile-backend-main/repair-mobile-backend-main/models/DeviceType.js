const mongoose = require("mongoose");

const deviceTypeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceType", deviceTypeSchema);