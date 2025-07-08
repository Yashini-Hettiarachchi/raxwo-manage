const express = require("express");
const router = express.Router();
const Salary = require("../models/salaryModel");
const Cashier = require("../models/cashierModel");

// Add Salary
router.post("/", async (req, res) => {
  try {
    const { employeeId } = req.body;
    const employee = await Cashier.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const newSalary = new Salary({
      ...req.body,
      employeeName: employee.cashierName,
    });
    await newSalary.save();
    res.status(201).json(newSalary);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all Salaries
router.get("/", async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ date: -1 });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single Salary
router.get("/:id", async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ message: "Salary not found" });
    res.json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Salary
router.put("/:id", async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (employeeId) {
      const employee = await Cashier.findOne({ id: employeeId });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      req.body.employeeName = employee.cashierName;
    }
    const updatedSalary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSalary) return res.status(404).json({ message: "Salary not found" });
    res.json(updatedSalary);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Salary
router.delete("/:id", async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ message: "Salary not found" });
    res.json({ message: "Salary deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Salary Summary by Date Range
router.get("/summary/:startDate/:endDate", async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const salaries = await Salary.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    const totalCost = salaries.reduce((sum, salary) => sum + salary.advance, 0);
    const groupedByDate = salaries.reduce((acc, salary) => {
      const date = new Date(salary.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + salary.advance;
      return acc;
    }, {});
    res.json({ totalCost, groupedByDate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Employee by ID for Auto-fill
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const employee = await Cashier.findOne({ id: req.params.employeeId });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ employeeName: employee.cashierName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;