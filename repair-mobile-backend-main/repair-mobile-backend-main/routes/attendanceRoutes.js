const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendanceModel");
const Cashier = require("../models/cashierModel");

// Mark Attendance
router.post("/", async (req, res) => {
  try {
    const { cashierId, remarks } = req.body;
    const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)
    const timeNow = new Date().toLocaleTimeString(); // Get current time

    const existingRecords = await Attendance.find({ cashierId, date: today });

    if (existingRecords.length === 0) {
      // First entry of the day: Mark In-time
      const cashier = await Cashier.findOne({ id: cashierId });

      if (!cashier) {
        return res.status(404).json({ message: "Cashier not found" });
      }

      const newAttendance = new Attendance({
        cashierId,
        cashierName: cashier.cashierName,
        jobRole: cashier.jobRole,
        month: new Date().toLocaleString("default", { month: "long" }),
        date: today,
        inTime: timeNow,
      });

      await newAttendance.save();
      return res.status(201).json({ message: "In-time marked", newAttendance });
    } else if (existingRecords.length === 1) {
      // Second entry: Mark Out-time with remarks
      await Attendance.findByIdAndUpdate(existingRecords[0]._id, { outTime: timeNow, remarks });
      return res.status(200).json({ message: "Out-time recorded with remarks", outTime: timeNow });
    } else {
      return res.status(400).json({ message: "Attendance already marked for today" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all attendance records
router.get("/", async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Attendance Record
router.put("/:id", async (req, res) => {
  try {
    const { outTime, remarks } = req.body;
    const updatedRecord = await Attendance.findByIdAndUpdate(
      req.params.id,
      { outTime, remarks },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({ message: "Attendance updated", updatedRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Attendance Record
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecord = await Attendance.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;