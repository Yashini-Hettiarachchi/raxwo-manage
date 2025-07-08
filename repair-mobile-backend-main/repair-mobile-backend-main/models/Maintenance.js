const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema({
    no: { type: Number, unique: true, sparse: true, required: true },  // Ensure it's a number
    date: { type: String, required: true },
    time: { type: String, required: true },
    serviceType: { type: String, required: true },
    price: { type: Number, required: true },
    remarks: { type: String, required: false }
});

module.exports = mongoose.model("Maintenance", MaintenanceSchema);
