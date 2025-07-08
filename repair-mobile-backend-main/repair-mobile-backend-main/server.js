const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("❌ MongoDB URI is missing! Add MONGODB_URI to your .env file.");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Test route
app.get('/', (req, res) => {
  res.send('shopmanager Management API');
});

// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const cashierRoutes = require("./routes/cashierRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const customerRoutes = require('./routes/customerRoutes');
const productRepairRoutes = require('./routes/productsRepair');
const supplierRoutes = require('./routes/suppliers');
const salaryRoutes = require("./routes/salary");
const deviceIssuesRouter = require("./routes/deviceIssues");
const deviceTypesRoutes = require("./routes/deviceTypes");
const extraIncomeRoutes = require("./routes/extraIncome");

app.use("/api/extra-income", extraIncomeRoutes);

app.use("/api/deviceTypes", deviceTypesRoutes);
app.use("/api/deviceIssues", deviceIssuesRouter);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/cashiers", cashierRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", customerRoutes);
app.use("/api/productsRepair", productRepairRoutes);
app.use("/api/salaries", salaryRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);

  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.stack,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'Not Found',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
