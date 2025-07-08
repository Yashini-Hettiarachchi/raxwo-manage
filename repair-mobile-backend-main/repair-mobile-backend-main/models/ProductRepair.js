const mongoose = require("mongoose");

const productRepairSchema = new mongoose.Schema({
  // Customer Details
  customerType: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: false },
  // NIC and address fields kept but not required as per requirements
  customerNIC: { type: String, required: false },
  customerAddress: { type: String, required: false },

  // Job Details
  repairInvoice: { type: String, required: true, unique: true },
  deviceType: { type: String, required: true },
  itemName: { type: String, required: true },
  serialNumber: { type: String, required: false },
  estimationValue: { type: Number, required: false, default: 0 },
  checkingCharge: { type: Number, required: false, default: 0 },
  issueDescription: { type: String, required: true },
  additionalNotes: { type: String, required: false },
  repairCost: { type: Number, required: false, default: 0 },
  repairStatus: { type: String, required: true, default: "Pending" },
  repairCode: { type: String, required: true, unique: true },
  repairCart: [{ type: Object }],
  totalRepairCost: { type: Number, required: false, default: 0 },
  technicianReview: { type: String, required: false },
  // Services and discounts
  services: {
    type: [
      {
        serviceName: { type: String, required: true },
        discountAmount: { type: Number, required: true, min: 0 },
        description: { type: String, required: false },
      },
    ],
    default: [],
  },
  // Additional services after repair completion
  additionalServices: {
    type: [
      {
        serviceName: { type: String, required: true },
        serviceAmount: { type: Number, required: true, min: 0 },
        description: { type: String, required: false },
        dateAdded: { type: Date, default: Date.now },
        isPaid: { type: Boolean, default: false }
      },
    ],
    default: [],
  },
  totalDiscountAmount: { type: Number, required: false, default: 0 },
  totalAdditionalServicesAmount: { type: Number, required: false, default: 0 },
  finalAmount: { type: Number, required: false, default: 0 },
  // Change history to track modifications
  changeHistory: [{
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changeType: { type: String, enum: ['create', 'update', 'delete', 'select'], required: true }
  }]
});

// Enable timestamps to add createdAt and updatedAt fields
productRepairSchema.set('timestamps', true);

module.exports = mongoose.model("ProductRepair", productRepairSchema);