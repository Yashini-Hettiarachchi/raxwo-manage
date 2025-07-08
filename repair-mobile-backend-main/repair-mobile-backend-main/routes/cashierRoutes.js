const express = require("express");
const router = express.Router();
const Cashier = require("../models/cashierModel");

// Add Cashier
router.post("/", async (req, res) => {
  try {
    const newCashier = new Cashier(req.body);
    await newCashier.save();
    res.status(201).json(newCashier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all Cashiers
router.get("/", async (req, res) => {
  try {
    const cashiers = await Cashier.find();
    res.json(cashiers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single Cashier
router.get("/:id", async (req, res) => {
  try {
    const cashier = await Cashier.findById(req.params.id);
    if (!cashier) return res.status(404).json({ message: "Cashier not found" });
    res.json(cashier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Cashier
router.put("/:id", async (req, res) => {
  try {
    const updatedCashier = await Cashier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCashier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Cashier
router.delete("/:id", async (req, res) => {
  try {
    await Cashier.findByIdAndDelete(req.params.id);
    res.json({ message: "Cashier deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;