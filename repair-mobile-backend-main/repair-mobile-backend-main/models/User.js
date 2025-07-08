// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['superadmin','admin', 'cashier'], required: true }
});

module.exports = mongoose.model('User', UserSchema);
