const express = require("express");
const router = express.Router();
const Maintenance = require("../models/Maintenance");

router.post("/", async (req, res) => {
    try {
        console.log("Incoming request body:", req.body); // Debugging
        
        const { serviceType, price, remarks } = req.body;

        if (!serviceType || !price) {
            return res.status(400).json({ message: "Service Type and Price are required" });
        }

        const date = new Date().toISOString().split("T")[0]; // Auto-fill date (YYYY-MM-DD)
        const time = new Date().toLocaleTimeString(); // Auto-fill time (HH:MM:SS)

        // ✅ Fix: Ensure `no` is always a valid number
        const lastRecord = await Maintenance.findOne().sort({ no: -1 });

        let newNo = 1;  // Default to 1 if no records exist
        if (lastRecord && lastRecord.no) {
            newNo = lastRecord.no + 1;
        }

        const newMaintenance = new Maintenance({ 
            no: newNo, 
            date, 
            time, 
            serviceType, 
            price, 
            remarks 
        });

        await newMaintenance.save();
        console.log("✅ Maintenance record saved:", newMaintenance);
        
        res.status(201).json(newMaintenance);
    } catch (error) {
        console.error("🔥 Error adding maintenance record:", error);
        res.status(500).json({ message: error.message });
    }
});
// Get All Maintenance Records
router.get("/", async (req, res) => {
    try {
        const maintenanceRecords = await Maintenance.find();
        res.status(200).json(maintenanceRecords);
    } catch (error) {
        console.error("Error fetching maintenance records:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get a Single Maintenance Record
router.get("/:id", async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);
        if (!maintenance) return res.status(404).json({ message: "Not Found" });

        res.status(200).json(maintenance);
    } catch (error) {
        console.error("Error fetching maintenance record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update Maintenance Record
router.put("/:id", async (req, res) => {
    try {
        const { serviceType, price, remarks } = req.body;
        const updatedMaintenance = await Maintenance.findByIdAndUpdate(
            req.params.id,
            { serviceType, price, remarks },
            { new: true }
        );

        res.status(200).json(updatedMaintenance);
    } catch (error) {
        console.error("Error updating maintenance record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Delete Maintenance Record
router.delete("/:id", async (req, res) => {
    try {
        await Maintenance.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting maintenance record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
