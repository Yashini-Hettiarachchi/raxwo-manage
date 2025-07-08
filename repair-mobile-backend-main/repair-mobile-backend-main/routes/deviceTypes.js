const express = require("express");
const router = express.Router();
const DeviceType = require("../models/DeviceType");

// GET: Get all device types
router.get("/", async (req, res) => {
  try {
    const deviceTypes = await DeviceType.find().sort({ createdAt: -1 });
    res.json(deviceTypes);
  } catch (err) {
    console.error("GET /api/deviceTypes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Add a new device type
router.post("/", async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !type.trim()) {
      return res.status(400).json({ message: "Device type is required" });
    }

    // Check if type already exists
    const existingType = await DeviceType.findOne({ type: type.trim() });
    if (existingType) {
      return res.status(400).json({ message: "This device type already exists" });
    }

    const deviceType = new DeviceType({
      type: type.trim(),
    });

    const newType = await deviceType.save();
    res.status(201).json(newType);
  } catch (err) {
    console.error("POST /api/deviceTypes error:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;