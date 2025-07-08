const express = require("express");
const router = express.Router();
const ExtraIncome = require("../models/ExtraIncome");

// Create a new extra income record
router.post("/", async (req, res) => {
  try {
    const { date, incomeType, amount, description } = req.body;
    console.log("Creating extra income:", { date, incomeType, amount, description });

    const extraIncome = new ExtraIncome({
      date: new Date(date),
      incomeType,
      amount: parseFloat(amount),
      description,
    });

    await extraIncome.save();
    res.status(201).json(extraIncome);
  } catch (err) {
    console.error("Error creating extra income:", err);
    res.status(500).json({ message: "Error creating extra income", error: err.message });
  }
});

// Get all extra income records
router.get("/", async (req, res) => {
  try {
    const extraIncomes = await ExtraIncome.find().sort({ date: -1 });
    console.log(`Fetched ${extraIncomes.length} extra income records`);
    res.json(extraIncomes);
  } catch (err) {
    console.error("Error fetching extra incomes:", err);
    res.status(500).json({ message: "Error fetching extra incomes", error: err.message });
  }
});

// Update an extra income record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, incomeType, amount, description } = req.body;
    console.log(`Updating extra income ID ${id}:`, { date, incomeType, amount, description });

    const extraIncome = await ExtraIncome.findByIdAndUpdate(
      id,
      {
        date: new Date(date),
        incomeType,
        amount: parseFloat(amount),
        description,
      },
      { new: true, runValidators: true }
    );

    if (!extraIncome) {
      return res.status(404).json({ message: "Extra income not found" });
    }

    res.json(extraIncome);
  } catch (err) {
    console.error("Error updating extra income:", err);
    res.status(500).json({ message: "Error updating extra income", error: err.message });
  }
});

// Delete an extra income record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting extra income ID ${id}`);

    const extraIncome = await ExtraIncome.findByIdAndDelete(id);
    if (!extraIncome) {
      return res.status(404).json({ message: "Extra income not found" });
    }

    res.json({ message: "Extra income deleted successfully" });
  } catch (err) {
    console.error("Error deleting extra income:", err);
    res.status(500).json({ message: "Error deleting extra income", error: err.message });
  }
});

module.exports = router;