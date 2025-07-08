const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ProductRepair = require("../models/ProductRepair");
const Product = require("../models/Product");

// Middleware: Get repair by ID
async function getRepair(req, res, next) {
  try {
    // Log the request parameters for debugging
    console.log("getRepair middleware - ID:", req.params.id);

    // Validate the ID format
    if (!req.params.id) {
      return res.status(400).json({
        message: "Repair ID is required",
        error: "No ID provided in the request"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid repair ID format",
        error: "The provided ID is not a valid MongoDB ObjectId"
      });
    }

    try {
      // Find the repair by ID
      const repair = await ProductRepair.findById(req.params.id);

      // Check if repair exists
      if (!repair) {
        return res.status(404).json({
          message: "Cannot find repair record",
          error: `No repair found with ID: ${req.params.id}`
        });
      }

      // Attach the repair to the request object
      req.repair = repair;
      next();
    } catch (dbErr) {
      console.error("Database error in getRepair:", dbErr);
      return res.status(500).json({
        message: "Error retrieving repair record from database",
        error: dbErr.toString()
      });
    }
  } catch (err) {
    console.error("Unexpected error in getRepair middleware:", err);
    return res.status(500).json({
      message: "An unexpected error occurred",
      error: err.toString()
    });
  }
}

// GET: Get all repairs
router.get("/", async (req, res) => {
  try {
    const repairs = await ProductRepair.find();
    console.log("GET /api/productsRepair - Raw repairs data:", repairs.map(repair => ({
      id: repair._id,
      review: repair.technicianReview,
      customerName: repair.customerName
    })));
    res.json(repairs);
  } catch (err) {
    console.error("Error fetching repairs:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST: Create a new repair
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/productsRepair - Received body:", req.body);
    const latestRepair = await ProductRepair.findOne().sort({ repairInvoice: -1 });
    let newInvoiceNumber = 1;
    if (latestRepair && latestRepair.repairInvoice) {
      const latestNumber = parseInt(latestRepair.repairInvoice.replace("REP", ""), 10);
      newInvoiceNumber = latestNumber + 1;
    }
    const repairInvoice = `REP${String(newInvoiceNumber).padStart(2, "0")}`;
    console.log("Generated repairInvoice:", repairInvoice);

    const repair = new ProductRepair({
      // Customer Details
      customerType: req.body.customerType || "New Customer",
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail || "N/A",
      // NIC and address fields kept but not displayed in UI as per requirements
      customerNIC: req.body.customerNIC || "N/A",
      customerAddress: req.body.customerAddress || "N/A",

      // Job Details
      repairInvoice,
      deviceType: req.body.deviceType || req.body.itemName, // Fallback to itemName if deviceType is not available
      itemName: req.body.deviceType || req.body.itemName, // Set itemName equal to deviceType
      technician: req.body.technician || "N/A",
      serialNumber: req.body.serialNumber || "N/A",
      estimationValue: req.body.estimationValue ? parseFloat(req.body.estimationValue) : 0,
      checkingCharge: req.body.checkingCharge ? parseFloat(req.body.checkingCharge) : 0,
      issueDescription: req.body.issueDescription,
      additionalNotes: req.body.additionalNotes || "N/A",
      repairCost: req.body.repairCost ? parseFloat(req.body.repairCost) : 0,
      repairStatus: req.body.repairStatus || "Pending",
      repairCode: `RC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      repairCart: req.body.repairCart || [],
      totalRepairCost: req.body.totalRepairCost || req.body.repairCost || 0,
      // Initialize change history with creation record
      changeHistory: [{
        field: 'creation',
        oldValue: null,
        newValue: 'New repair job created',
        changedBy: req.body.changedBy || 'system',
        changedAt: new Date(),
        changeType: 'create'
      }]
    });

    const newRepair = await repair.save();
    console.log("Saved new repair:", newRepair);
    res.status(201).json(newRepair);
  } catch (err) {
    console.error("POST / error:", err);
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Update repair cart incrementally, decrease stock, and calculate totalRepairCost
router.patch("/update-cart/:id", getRepair, async (req, res) => {
  try {
    const repair = req.repair;
    const { selectedProducts } = req.body;
    console.log("Received selectedProducts:", selectedProducts);

    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res.status(400).json({ message: "No products selected" });
    }

    const allProducts = await Product.find();
    console.log("Fetched products:", allProducts);

    const existingCart = repair.repairCart || [];
    const updatedCartMap = new Map(existingCart.map(item => [item.itemCode, item]));

    for (const selectedProduct of selectedProducts) {
      const { itemCode, quantity, supplierName } = selectedProduct;
      console.log(`Processing product: ${itemCode}, quantity: ${quantity}, supplierName: ${supplierName}`);

      const product = allProducts.find((p) => p.itemCode === itemCode);
      if (!product) {
        return res.status(404).json({ message: `Product with itemCode ${itemCode} not found` });
      }

      console.log(`Found product in database:`, product);

      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${itemCode}. Available: ${product.stock}` });
      }

      // Ensure supplierName is set
      product.supplierName = supplierName || product.supplierName || "Default Supplier";

      // Log stock change BEFORE updating
      const oldStock = product.stock;
      const newStock = product.stock - quantity;
      product.changeHistory = [
        ...(product.changeHistory || []),
        {
          field: 'stock',
          oldValue: oldStock,
          newValue: newStock,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        }
      ];

      // Update product stock
      product.stock = newStock;

      // Debug: Log before saving
      console.log('Saving product with updated changeHistory:', product._id, product.changeHistory);

      try {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id },
          {
            $set: {
              stock: product.stock,
              supplierName: product.supplierName,
              changeHistory: product.changeHistory
            }
          },
          {
            new: true,
            runValidators: true
          }
        );

        // Debug: Log after saving
        console.log('Updated product:', updatedProduct);

        if (!updatedProduct) {
          throw new Error(`Product with ID ${product._id} not found during update`);
        }

        console.log(`Stock updated for ${itemCode}: ${product.stock} remaining, supplierName: ${product.supplierName}`);
        // Debug: Log the updated changeHistory for this product
        console.log(`Updated changeHistory for ${itemCode}:`, JSON.stringify(updatedProduct.changeHistory, null, 2));
      } catch (saveErr) {
        console.error(`Error saving product ${itemCode}:`, saveErr);
        try {
          await Product.findByIdAndUpdate(
            product._id,
            {
              stock: product.stock,
              supplierName: "Default Supplier"
            },
            {
              new: true,
              runValidators: false
            }
          );
          console.log(`Fallback update succeeded for ${itemCode}`);
        } catch (fallbackErr) {
          console.error(`Fallback update also failed for ${itemCode}:`, fallbackErr);
          return res.status(500).json({ message: `Error updating product ${itemCode}: ${saveErr.message}` });
        }
      }

      // Update cart
      if (updatedCartMap.has(itemCode)) {
        const existingItem = updatedCartMap.get(itemCode);
        existingItem.quantity += quantity;
        existingItem.cost = product.sellingPrice * existingItem.quantity;
      } else {
        updatedCartMap.set(itemCode, {
          itemCode,
          itemName: product.itemName, // Ensure itemName is included
          quantity,
          cost: product.sellingPrice * quantity,
        });
      }
    }

    repair.repairCart = Array.from(updatedCartMap.values());
    const cartTotal = repair.repairCart.reduce((total, item) => total + item.cost, 0);
    repair.totalRepairCost = cartTotal + (repair.repairCost || 0);
    repair.repairStatus = "In Progress";

    // Explicitly ensure itemName is preserved
    if (!repair.itemName) {
      repair.itemName = repair.deviceType || "Default Item"; // Fallback to deviceType or a default value
    }

    // Add log entry for SELECT PRODUCTS FOR REPAIR
    repair.changeHistory = [
      ...(repair.changeHistory || []),
      {
        field: 'selectProductsForRepair',
        oldValue: existingCart,
        newValue: repair.repairCart,
        changedBy: req.body.changedBy || 'system',
        changedAt: new Date(),
        changeType: 'select'
      }
    ];

    try {
      const updatedRepair = await repair.save();
      console.log("Updated repair with totalRepairCost:", updatedRepair);
      res.json(updatedRepair);
    } catch (saveErr) {
      console.error("Error saving repair:", saveErr);
      res.status(500).json({ message: `Error saving repair: ${saveErr.message}` });
    }
  } catch (err) {
    console.error("PATCH /update-cart error:", err);
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Return products from repair cart, increase stock, and recalculate totalRepairCost
router.patch("/return-cart/:id", getRepair, async (req, res) => {
  try {
    const repair = req.repair;
    const { returnProducts } = req.body;
    console.log("Received returnProducts:", returnProducts);

    if (!Array.isArray(returnProducts) || returnProducts.length === 0) {
      return res.status(400).json({ message: "No products selected for return" });
    }

    const allProducts = await Product.find();
    const existingCart = repair.repairCart || [];
    const updatedCartMap = new Map(existingCart.map(item => [item.itemCode, item]));

    for (const returnProduct of returnProducts) {
      const { itemCode, quantity } = returnProduct;
      console.log(`Processing return for product: ${itemCode}, quantity: ${quantity}`);

      const product = allProducts.find((p) => p.itemCode === itemCode);
      if (!product) {
        return res.status(404).json({ message: `Product with itemCode ${itemCode} not found` });
      }

      console.log(`Found product in database:`, product);

      const cartItem = updatedCartMap.get(itemCode);
      if (!cartItem) {
        return res.status(400).json({ message: `Item ${itemCode} not found in repair cart` });
      }
      if (cartItem.quantity < quantity) {
        return res.status(400).json({ message: `Return quantity ${quantity} for ${itemCode} exceeds cart quantity ${cartItem.quantity}` });
      }

      // CRITICAL FIX: Always ensure supplierName is set before saving
      // Force set supplierName regardless of current value to ensure it's always present
      const returnSupplierName = returnProduct.supplierName;
      if (returnSupplierName) {
        console.log(`Setting supplierName from request: ${returnSupplierName}`);
        product.supplierName = returnSupplierName;
      } else {
        console.log(`Setting default supplierName: Default Supplier`);
        product.supplierName = "Default Supplier";
      }

      // Increase product stock
      // Log stock change before increasing
      product.changeHistory = [
        ...(product.changeHistory || []),
        {
          field: 'stock',
          oldValue: product.stock,
          newValue: product.stock + quantity,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        }
      ];
      product.stock += quantity;

      try {
        // First, ensure the product has a valid supplierName
        if (!product.supplierName || product.supplierName.trim() === '') {
          product.supplierName = "Default Supplier";
        }

        // Use findOneAndUpdate with the itemCode to ensure we're updating the correct product
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id },
          {
            $set: {
              stock: product.stock,
              supplierName: product.supplierName
            }
          },
          {
            new: true,
            runValidators: true // Enable validation to catch any issues
          }
        );

        if (!updatedProduct) {
          throw new Error(`Product with ID ${product._id} not found during update`);
        }

        console.log(`Stock updated for ${itemCode}: ${product.stock} remaining, supplierName: ${product.supplierName}`);
      } catch (saveErr) {
        console.error(`Error saving product ${itemCode}:`, saveErr);
        // Try one more time with validation disabled as a fallback
        try {
          await Product.findByIdAndUpdate(
            product._id,
            {
              stock: product.stock,
              supplierName: "Default Supplier" // Force a default value
            },
            {
              new: true,
              runValidators: false // Disable validation as a last resort
            }
          );
          console.log(`Fallback update succeeded for ${itemCode}`);
        } catch (fallbackErr) {
          console.error(`Fallback update also failed for ${itemCode}:`, fallbackErr);
          return res.status(500).json({ message: `Error updating product ${itemCode}: ${saveErr.message}` });
        }
      }

      // Update or remove cart item
      if (cartItem.quantity === quantity) {
        updatedCartMap.delete(itemCode);
      } else {
        cartItem.quantity -= quantity;
        cartItem.cost = (cartItem.cost / (cartItem.quantity + quantity)) * cartItem.quantity;
        updatedCartMap.set(itemCode, cartItem);
      }
    }

    repair.repairCart = Array.from(updatedCartMap.values());
    const cartTotal = repair.repairCart.reduce((total, item) => total + item.cost, 0);
    repair.totalRepairCost = cartTotal + (repair.repairCost || 0);

    try {
      const updatedRepair = await repair.save();
      console.log("Updated repair after return:", updatedRepair);
      res.json(updatedRepair);
    } catch (saveErr) {
      console.error("Error saving repair:", saveErr);
      res.status(500).json({ message: `Error saving repair: ${saveErr.message}` });
    }
  } catch (err) {
    console.error("PATCH /return-cart error:", err);
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Add additional service to a repair
router.patch("/add-service/:id", getRepair, async (req, res) => {
  try {
    const repair = req.repair;

    // Log the incoming request body for debugging
    console.log("Add service request body:", JSON.stringify(req.body));

    const { additionalService } = req.body;

    // Validate the input data
    if (!additionalService) {
      return res.status(400).json({ message: "additionalService object is required" });
    }

    if (!additionalService.serviceName || additionalService.serviceName.trim() === "") {
      return res.status(400).json({ message: "Service name is required" });
    }

    if (additionalService.serviceAmount === undefined || additionalService.serviceAmount === null) {
      return res.status(400).json({ message: "Service amount is required" });
    }

    // Parse the service amount to ensure it's a number
    const serviceAmount = parseFloat(additionalService.serviceAmount);
    if (isNaN(serviceAmount) || serviceAmount < 0) {
      return res.status(400).json({ message: "Service amount must be a valid positive number" });
    }

    // Add the new service to the additionalServices array
    const newService = {
      serviceName: additionalService.serviceName.trim(),
      serviceAmount: serviceAmount,
      description: additionalService.description ? additionalService.description.trim() : "",
      dateAdded: new Date(),
      isPaid: false
    };

    // Initialize additionalServices array if it doesn't exist
    if (!repair.additionalServices) {
      repair.additionalServices = [];
    }

    // Add the new service
    repair.additionalServices.push(newService);

    // Calculate total additional services amount
    const totalAdditionalServicesAmount = repair.additionalServices.reduce(
      (total, service) => total + (parseFloat(service.serviceAmount) || 0), 0
    );

    repair.totalAdditionalServicesAmount = totalAdditionalServicesAmount;

    // Calculate final amount (totalRepairCost + totalAdditionalServicesAmount)
    repair.finalAmount = (parseFloat(repair.totalRepairCost) || 0) + totalAdditionalServicesAmount;

    // If repair is completed, ensure it stays completed
    if (repair.repairStatus === "Completed") {
      // Keep the status as completed, we're just adding an additional service
      repair.repairStatus = "Completed";
    }

    try {
      // Save the updated repair document
      const updatedRepair = await repair.save();
      console.log("PATCH /add-service/:id - Updated repair with additional service");

      // Return the updated repair document
      return res.status(200).json(updatedRepair);
    } catch (saveErr) {
      console.error("Error saving repair with additional service:", saveErr);
      // Ensure we return a proper JSON response
      return res.status(500).json({
        message: `Error saving repair: ${saveErr.message}`,
        error: saveErr.toString()
      });
    }
  } catch (err) {
    console.error("PATCH /add-service error:", err);
    // Ensure we return a proper JSON response
    return res.status(400).json({
      message: err.message || "An error occurred while adding the service",
      error: err.toString()
    });
  }
});

// PATCH: Mark additional service as paid
router.patch("/pay-service/:id", getRepair, async (req, res) => {
  try {
    const repair = req.repair;

    // Log the incoming request body for debugging
    console.log("Pay service request body:", JSON.stringify(req.body));

    const { serviceIndex } = req.body;

    // Validate the service index
    if (serviceIndex === undefined || serviceIndex === null) {
      return res.status(400).json({ message: "Service index is required" });
    }

    // Convert to number if it's a string
    const index = parseInt(serviceIndex, 10);
    if (isNaN(index)) {
      return res.status(400).json({ message: "Service index must be a valid number" });
    }

    // Check if additionalServices array exists and index is valid
    if (!repair.additionalServices || !Array.isArray(repair.additionalServices)) {
      return res.status(400).json({ message: "No additional services found for this repair" });
    }

    if (index < 0 || index >= repair.additionalServices.length) {
      return res.status(400).json({
        message: `Invalid service index: ${index}. Valid range is 0 to ${repair.additionalServices.length - 1}`
      });
    }

    // Mark the service as paid
    repair.additionalServices[index].isPaid = true;

    // If repair is completed, ensure it stays completed
    if (repair.repairStatus === "Completed") {
      // Keep the status as completed, we're just marking a service as paid
      repair.repairStatus = "Completed";
    }

    try {
      // Save the updated repair document
      const updatedRepair = await repair.save();
      console.log("PATCH /pay-service/:id - Marked service as paid");

      // Return the updated repair document
      return res.status(200).json(updatedRepair);
    } catch (saveErr) {
      console.error("Error saving repair after marking service as paid:", saveErr);
      // Ensure we return a proper JSON response
      return res.status(500).json({
        message: `Error saving repair: ${saveErr.message}`,
        error: saveErr.toString()
      });
    }
  } catch (err) {
    console.error("PATCH /pay-service error:", err);
    // Ensure we return a proper JSON response
    return res.status(400).json({
      message: err.message || "An error occurred while marking the service as paid",
      error: err.toString()
    });
  }
});

// Helper function to record changes
async function recordChanges(repair, updates, changedBy, changeType) {
  const changes = [];
  
  for (const [field, newValue] of Object.entries(updates)) {
    if (field !== 'changeHistory' && repair[field] !== newValue) {
      changes.push({
        field,
        oldValue: repair[field],
        newValue,
        changedBy,
        changedAt: new Date(),
        changeType
      });
    }
  }
  
  if (changes.length > 0) {
    repair.changeHistory = [...(repair.changeHistory || []), ...changes];
  }
}

// PATCH: Partial update for repair details
router.patch("/:id", getRepair, async (req, res) => {
  try {
    console.log("PATCH /api/productsRepair/:id - Request body:", req.body);
    console.log("PATCH /api/productsRepair/:id - Repair ID:", req.params.id);

    const repair = await ProductRepair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: "Repair not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "customerName",
      "customerPhone",
      "deviceType",
      "itemName",
      "issueDescription",
      "repairCart",
      "totalRepairCost",
      "repairStatus",
      "technicianReview",
      "services",
      "totalDiscountAmount",
      "finalAmount",
      "additionalServices",
      "totalAdditionalServicesAmount"
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Record changes before updating
    const changes = [];
    for (const [field, newValue] of Object.entries(updates)) {
      if (field !== 'changeHistory' && repair[field] !== newValue) {
        changes.push({
          field,
          oldValue: repair[field],
          newValue,
          changedBy: req.body.changedBy || 'system',
          changedAt: new Date(),
          changeType: 'update'
        });
      }
    }

    if (changes.length > 0) {
      repair.changeHistory = [...(repair.changeHistory || []), ...changes];
    }

    // Apply updates
    Object.assign(repair, updates);
    await repair.save();

    res.json(repair);
  } catch (err) {
    console.error("Error updating repair:", err);
    res.status(400).json({ message: err.message });
  }
});

// PUT: Full update for repair
router.put("/:id", getRepair, async (req, res) => {
  try {
    // Extract all fields from request body
    const {
      customerType,
      customerName,
      customerPhone,
      customerEmail,
      customerNIC,
      customerAddress,
      deviceType,
      itemName,
      technician,
      serialNumber,
      estimationValue,
      checkingCharge,
      issueDescription,
      additionalNotes,
      repairCost,
      repairStatus,
      repairCart,
      services,
      additionalServices,
      totalDiscountAmount,
      totalAdditionalServicesAmount,
      totalRepairCost,
      finalAmount,
      changedBy
    } = req.body;

    // Calculate cart total
    const cartTotal = (repairCart || req.repair.repairCart || []).reduce(
      (total, item) => total + item.cost, 0
    );

    // Calculate total discount from services
    const servicesArray = services || req.repair.services || [];
    const calculatedTotalDiscountAmount = servicesArray.reduce(
      (total, service) => total + (service.discountAmount || 0), 0
    );

    // Calculate base total (cart total + repair cost)
    const baseTotal = cartTotal + (repairCost !== undefined ? parseFloat(repairCost) || 0 : req.repair.repairCost || 0);

    // Calculate total repair cost (base total - total discount)
    const calculatedTotalRepairCost = totalRepairCost !== undefined ?
      parseFloat(totalRepairCost) :
      Math.max(0, baseTotal - calculatedTotalDiscountAmount);

    // Calculate total additional services amount
    const additionalServicesArray = additionalServices || req.repair.additionalServices || [];
    const calculatedTotalAdditionalServicesAmount = additionalServicesArray.reduce(
      (total, service) => total + (service.serviceAmount || 0), 0
    );

    // Calculate final amount (totalRepairCost + totalAdditionalServicesAmount)
    const calculatedFinalAmount = finalAmount !== undefined ?
      parseFloat(finalAmount) :
      calculatedTotalRepairCost + calculatedTotalAdditionalServicesAmount;

    // Prepare updates object
    const updates = {
      customerType: customerType || req.repair.customerType || "New Customer",
      customerName: customerName || req.repair.customerName,
      customerPhone: customerPhone || req.repair.customerPhone,
      customerEmail: customerEmail || req.repair.customerEmail || "N/A",
      customerNIC: customerNIC || req.repair.customerNIC || "N/A",
      customerAddress: customerAddress || req.repair.customerAddress || "N/A",
      deviceType: deviceType || itemName || req.repair.deviceType,
      itemName: itemName || req.repair.itemName,
      technician: technician || req.repair.technician || "N/A",
      serialNumber: serialNumber || req.repair.serialNumber || "N/A",
      estimationValue: estimationValue !== undefined ? parseFloat(estimationValue) : req.repair.estimationValue || 0,
      checkingCharge: checkingCharge !== undefined ? parseFloat(checkingCharge) : req.repair.checkingCharge || 0,
      issueDescription: issueDescription || req.repair.issueDescription,
      additionalNotes: additionalNotes || req.repair.additionalNotes || "N/A",
      repairCost: repairCost !== undefined ? parseFloat(repairCost) || 0 : req.repair.repairCost || 0,
      repairStatus: repairStatus || req.repair.repairStatus,
      repairCart: repairCart || req.repair.repairCart || [],
      services: services || req.repair.services || [],
      additionalServices: additionalServices || req.repair.additionalServices || [],
      totalDiscountAmount: calculatedTotalDiscountAmount,
      totalAdditionalServicesAmount: calculatedTotalAdditionalServicesAmount,
      totalRepairCost: calculatedTotalRepairCost,
      finalAmount: calculatedFinalAmount,
    };

    // Record changes before updating
    await recordChanges(req.repair, updates, changedBy || 'system', 'update');

    const updatedRepair = await ProductRepair.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true, overwrite: true }
    );

    console.log("PUT /api/productsRepair/:id - Updated repair:", updatedRepair);
    res.json(updatedRepair);
  } catch (err) {
    console.error("PUT / error:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Remove a repair
router.delete("/:id", getRepair, async (req, res) => {
  try {
    await ProductRepair.deleteOne({ _id: req.repair._id });
    console.log("DELETE /api/productsRepair/:id - Deleted repair ID:", req.repair._id);
    res.json({ message: "Repair record deleted successfully" });
  } catch (err) {
    console.error("DELETE / error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;