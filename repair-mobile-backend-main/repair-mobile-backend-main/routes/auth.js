const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || '12345';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password',
  },
});

// Registration Route
router.post('/register', async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  if (!username || !email || !phone || !password || !role) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, phone, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter email and password" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Token:', token);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: "Please provide an email." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ msg: "If that email exists in our system, a password reset link has been sent." });
    }

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #1abc9c; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "If that email exists in our system, a password reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ msg: "Please provide a new password." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password has been reset successfully." });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ msg: "Token has expired." });
    }
    res.status(400).json({ msg: "Invalid or expired token." });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, phone, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { username, email, phone, role }, { new: true });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;