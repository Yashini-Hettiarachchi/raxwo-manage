const express = require("express");
const router = express.Router();
const DeviceIssue = require("../models/DeviceIssue");

// GET: Get all device issues
router.get("/", async (req, res) => {
  try {
    const deviceIssues = await DeviceIssue.find().sort({ createdAt: -1 });
    res.json(deviceIssues);
  } catch (err) {
    console.error("GET /api/deviceIssues error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Add a new device issue
router.post("/", async (req, res) => {
  try {
    const { issue } = req.body;
    if (!issue || !issue.trim()) {
      return res.status(400).json({ message: "Issue description is required" });
    }

    // Check if issue already exists
    const existingIssue = await DeviceIssue.findOne({ issue: issue.trim() });
    if (existingIssue) {
      return res.status(400).json({ message: "This issue already exists" });
    }

    const deviceIssue = new DeviceIssue({
      issue: issue.trim(),
    });

    const newIssue = await deviceIssue.save();
    res.status(201).json(newIssue);
  } catch (err) {
    console.error("POST /api/deviceIssues error:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;