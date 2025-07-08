const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Save customer details (Credit/Wholesale)
router.post('/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({ message: 'Customer details saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
