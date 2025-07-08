const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    jobRole: { type: String, required: true },
    month: { type: String, required: true },
    date: { type: String, required: true },
    inTime: { type: String },
    outTime: { type: String },
    remarks: { type: String,require:true}, // Ensure remarks field is defined
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);