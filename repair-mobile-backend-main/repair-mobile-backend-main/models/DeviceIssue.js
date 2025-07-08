const mongoose = require("mongoose");

const deviceIssueSchema = new mongoose.Schema({
  issue: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceIssue", deviceIssueSchema);