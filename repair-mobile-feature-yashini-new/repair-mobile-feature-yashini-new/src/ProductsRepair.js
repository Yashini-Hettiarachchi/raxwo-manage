import React, { useState, useEffect } from "react";
import EditProductRepair from "./EditProductRepair";
import AddProductRepair from "./AddProductRepair";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "./ProductRepairList.css";
import "./TechnicianReviewModal.css"; // Add this line
import pdficon from "./icon/pdf.png";
import excelicon from "./icon/excle.png";
import refreshicon from "./icon/refresh.png";
import repairicon from "./icon/repair.png";
import paymenticon from "./icon/payment.png";
import jobBillIcon from "./icon/bill.png";
import deleteicon from "./icon/delete.png";
import edticon from "./icon/edit.png";
import viewicon from "./icon/statistics.png";
import selecticon from "./icon/sucess.png";
import { useMemo } from "react";


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFilePdf, faFileExcel, faSearch, faPlus, faTimes, faHistory } from '@fortawesome/free-solid-svg-icons';
import ChangeHistory from './components/ChangeHistory';


const API_URL = "http://localhost:5002/api/productsRepair";
const PRODUCT_API_URL = "http://localhost:5002/api/products";

const ProductRepairList = ({ darkMode }) => {
  const [repairs, setRepairs] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [returnFormData, setReturnFormData] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ serviceName: "", discountAmount: 0, description: "" });
  const [additionalServices, setAdditionalServices] = useState([]);
  const [newAdditionalService, setNewAdditionalService] = useState({ serviceName: "", serviceAmount: 0, description: "" });
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewRepair, setSelectedReviewRepair] = useState(null);
  const [technicianReview, setTechnicianReview] = useState("");
  const [showCashierChangesModal, setShowCashierChangesModal] = useState(false);
  const [cashierChanges, setCashierChanges] = useState({});
  const [showAllStatusesInline, setShowAllStatusesInline] = useState(false);
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // State for filtering and pagination
  const [currentStatusFilter, setCurrentStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and pagination logic
  const statusFilters = ["All", "Pending", "In Progress", "Completed", "Cancelled"];
  const isRepairPaid = (repair) => {
    if (!repair.additionalServices || repair.additionalServices.length === 0) return true;
    return repair.additionalServices.every(service => service.isPaid);
  };
    
  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair) => {
      const matchesSearch =
        (repair.repairInvoice || repair.repairCode || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (repair.customerName || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (repair.customerPhone || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (repair.deviceType || repair.itemName || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (repair.issueDescription || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (repair.serialNumber || "").toLowerCase().includes(productSearchQuery.toLowerCase());
      return currentStatusFilter === "All" ? matchesSearch : matchesSearch && repair.repairStatus === currentStatusFilter;
    });
  }, [repairs, productSearchQuery, currentStatusFilter]);
    // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };
  

  const fetchRepairs = () => {
    setLoading(true);
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        console.log("Raw API response:", data);

        const repairData = Array.isArray(data) ? data : data.repairs || [];

        // Ensure all repair records have repairCart, totalRepairCost, and changeHistory
        const processedRepairData = repairData.map(repair => {
          console.log("Processing repair:", repair.repairInvoice || repair.repairCode);
          console.log("Change history before processing:", repair.changeHistory);
        
          const processedChangeHistory = Array.isArray(repair.changeHistory)
            ? repair.changeHistory.map(change => ({
                ...change,
                changedAt: change.changedAt || new Date().toISOString(),
                changedBy: change.changedBy || 'System',
                field: change.field || 'Unknown Field',
                oldValue: change.oldValue !== undefined ? change.oldValue : 'N/A',
                newValue: change.newValue !== undefined ? change.newValue : 'N/A',
                changeType: change.changeType || 'UPDATE'
              }))
            : [];
        
          return {
            ...repair,
            repairCart: repair.repairCart || [],
            totalRepairCost: repair.totalRepairCost || 0,
            technicianReview: repair.technicianReview || "",
            changeHistory: processedChangeHistory,
            repairStatus: repair.repairStatus && statusFilters.includes(repair.repairStatus) 
              ? repair.repairStatus 
              : "Pending" // Default to "Pending" if status is invalid
          };
        });
        console.log("Processed repair data:", processedRepairData);
        setRepairs(processedRepairData);
        setLoading(false);
        if (processedRepairData.length === 0) {
          setError("No repair records found in the database.");
        }
      })
      .catch((err) => {
        console.error("Fetch repairs error:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchProducts = () => {
    fetch(PRODUCT_API_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        console.log("Fetched products:", data);
        setProducts(Array.isArray(data) ? data : data.products || []);
      })
      .catch((err) => {
        console.error("Fetch products error:", err);
        setError(err.message);
      });
  };

  useEffect(() => {
    fetchRepairs();
    fetchProducts();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDelete = async (id) => {
    const userRole = localStorage.getItem("role");
    if (userRole !== "admin") {
      setError("Only admins can delete repair records.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this repair record?")) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete repair record");
        setRepairs(repairs.filter((repair) => repair._id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (repair) => {
    // Add detailed logging to debug the repair data
    console.log("Selected repair for edit:", repair);
    console.log("Repair cart:", repair.repairCart);
    console.log("Total repair cost:", repair.totalRepairCost);

    // Make sure we're passing the complete repair object
    setSelectedRepair({
      ...repair,
      repairCart: repair.repairCart || [],
      totalRepairCost: repair.totalRepairCost || 0
    });
    setShowEditModal(true);
  };

  const handleView = (repair) => {
    setSelectedRepair(repair);
    setDiscount(0); // Reset discount when opening view modal
    setServices(repair.services || []); // Load existing services
    setNewService({ serviceName: "", discountAmount: 0, description: "" }); // Reset new service form
    setAdditionalServices(repair.additionalServices || []); // Load existing additional services
    setNewAdditionalService({ serviceName: "", serviceAmount: 0, description: "" }); // Reset new additional service form
    setShowViewModal(true);
  };

  const handleSelectProducts = (repair) => {
    setSelectedRepair(repair);
    setSelectedProducts([]);
    setShowSelectModal(true);
  };

  const handleProductSelection = (product) => {
    console.log("Selected product:", product);

    // Ensure supplierName and itemName are valid
    let supplierName = product.supplierName && product.supplierName.trim() !== ''
      ? product.supplierName
      : "Default Supplier";
    let itemName = product.itemName && product.itemName.trim() !== ''
      ? product.itemName
      : product.deviceType || "Default Item";

    console.log(`Using supplierName: ${supplierName}, itemName: ${itemName} for product ${product.itemCode}`);

    const existing = selectedProducts.find((p) => p.itemCode === product.itemCode);
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.itemCode === product.itemCode ? {
            ...p,
            quantity: p.quantity + 1,
            supplierName: supplierName,
            itemName: itemName
          } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, {
        itemCode: product.itemCode,
        itemName: itemName,
        quantity: 1,
        supplierName: supplierName
      }]);
    }
  };

  const handleRemoveProduct = (index) => {
    // Create a copy of the selectedProducts array
    const updatedProducts = [...selectedProducts];
    // Remove the product at the specified index
    updatedProducts.splice(index, 1);
    // Update the state with the new array
    setSelectedProducts(updatedProducts);
  };

  const handleUpdateQuantity = (index, change) => {
    // Create a copy of the selectedProducts array
    const updatedProducts = [...selectedProducts];
    // Get the current product
    const product = updatedProducts[index];
    // Calculate the new quantity (ensure it's at least 1)
    const newQuantity = Math.max(1, product.quantity + change);
    // Update the product's quantity
    updatedProducts[index] = { ...product, quantity: newQuantity };
    // Update the state with the new array
    setSelectedProducts(updatedProducts);
  };

  const handleReturnProduct = (repair) => {
    setSelectedRepair(repair);
    // Initialize return form data with cart items
    setReturnFormData(
      repair.repairCart.map((item) => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: 0,
        maxQuantity: item.quantity,
      }))
    );
    setShowReturnModal(true);
  };

  const handleReturnFormChange = (itemCode, value) => {
    const quantity = Math.max(0, Math.min(parseInt(value) || 0, returnFormData.find((item) => item.itemCode === itemCode).maxQuantity));
    setReturnFormData(
      returnFormData.map((item) =>
        item.itemCode === itemCode ? { ...item, quantity } : item
      )
    );
  };

  const handleReturnSubmit = async () => {
    try {
      // Get the products that have a quantity greater than 0
      const returnProducts = returnFormData
        .filter((item) => item.quantity > 0)
        .map((item) => {
          // Always set a valid supplierName for returned products
          const cartItem = selectedRepair.repairCart.find(cartItem => cartItem.itemCode === item.itemCode);

          // Ensure supplierName is a valid non-empty string
          let supplierName = "Default Supplier";
          if (cartItem?.supplierName && typeof cartItem.supplierName === 'string' && cartItem.supplierName.trim() !== '') {
            supplierName = cartItem.supplierName;
          }

          console.log(`Setting supplierName for returned product ${item.itemCode}: ${supplierName}`);

          return {
            itemCode: item.itemCode,
            quantity: item.quantity,
            supplierName: supplierName
          };
        });

      if (returnProducts.length === 0) {
        setError("Please select at least one product to return with a valid quantity.");
        return;
      }

      console.log("Sending returnProducts with supplierName:", returnProducts);

      // Show loading message
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/return-cart/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnProducts }),
      });

      // Parse response even if it's an error, to get the error message
      const responseData = await response.json();

      if (!response.ok) {
        console.error("Server error response:", responseData);
        throw new Error(responseData.message || "Failed to return products");
      }

      console.log("Updated repair after return:", responseData);
      setRepairs(repairs.map((r) => (r._id === responseData._id ? responseData : r)));
      setShowReturnModal(false);
      setReturnFormData([]);
      fetchRepairs();
      fetchProducts();
      setMessage("Products returned successfully!");
    } catch (err) {
      console.error("Error returning products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCart = async () => {
    const changedBy = localStorage.getItem('username') || 'system';
    try {
      if (selectedProducts.length === 0) {
        setError("No products selected. Please select at least one product.");
        return;
      }

      // Ensure all selected products have a valid supplierName
      const productsWithSupplier = selectedProducts.map(product => {
        // Always set supplierName to ensure it's present and valid
        let supplierName = "Default Supplier";
        if (product.supplierName && typeof product.supplierName === 'string' && product.supplierName.trim() !== '') {
          supplierName = product.supplierName;
        }

        console.log(`Ensuring product ${product.itemCode} has supplierName: ${supplierName}`);
        return {
          ...product,
          supplierName: supplierName
        };
      });

      console.log("Sending selectedProducts with supplier:", productsWithSupplier);

      // Show loading message
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/update-cart/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedProducts: productsWithSupplier, changedBy }),
      });

      // Parse response even if it's an error, to get the error message
      const responseData = await response.json();

      if (!response.ok) {
        console.error("Server error response:", responseData);
        throw new Error(responseData.message || "Failed to update cart");
      }

      console.log("Updated repair from server:", responseData);
      setRepairs(repairs.map((r) => (r._id === responseData._id ? responseData : r)));
      setShowSelectModal(false);
      setSelectedProducts([]);
      fetchRepairs();
      fetchProducts();
      setMessage("Cart updated successfully!");
    } catch (err) {
      console.error("Error updating cart:", err);

      // Provide more detailed error message
      let errorMessage = err.message;
      if (errorMessage.includes("supplierName")) {
        errorMessage = "Error with supplier name. Using default supplier name.";

        // Try again with explicit default supplier names
        try {
          const fixedProducts = selectedProducts.map(product => ({
            ...product,
            supplierName: "Default Supplier"
          }));

          console.log("Retrying with fixed supplier names:", fixedProducts);

          const retryResponse = await fetch(`${API_URL}/update-cart/${selectedRepair._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedProducts: fixedProducts, changedBy }),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log("Retry successful:", retryData);
            setRepairs(repairs.map((r) => (r._id === retryData._id ? retryData : r)));
            setShowSelectModal(false);
            setSelectedProducts([]);
            fetchRepairs();
            fetchProducts();
            setMessage("Cart updated successfully after retry!");
            setLoading(false);
            return;
          } else {
            const retryError = await retryResponse.json();
            console.error("Retry failed:", retryError);
            errorMessage += " Retry also failed.";
          }
        } catch (retryErr) {
          console.error("Error during retry:", retryErr);
          errorMessage += " Retry also failed.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleDecreaseCartQuantity = async (index) => {
    try {
      setLoading(true);
      setError("");

      // Get the current repair cart
      const updatedCart = [...selectedRepair.repairCart];
      const item = updatedCart[index];

      // Ensure the item exists and has a valid quantity
      if (!item || item.quantity <= 0) {
        setError("Invalid item or quantity.");
        return;
      }

      // Decrease quantity or remove item if quantity becomes zero
      if (item.quantity > 1) {
        updatedCart[index] = { ...item, quantity: item.quantity - 1 };
      } else {
        updatedCart.splice(index, 1);
      }

      // Calculate new cart total
      const newCartTotal = updatedCart.reduce((total, cartItem) => total + (cartItem.cost || 0), 0);
      const totalAdditionalServicesAmount = selectedRepair.totalAdditionalServicesAmount || 0;
      const finalAmount = newCartTotal + (selectedRepair.repairCost || 0) - (selectedRepair.totalDiscountAmount || 0) + totalAdditionalServicesAmount;

      // Update the server with the new cart
      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repairCart: updatedCart,
          totalRepairCost: newCartTotal,
          finalAmount: finalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cart quantity");
      }

      const updatedRepair = await response.json();
      console.log("Updated repair after decreasing quantity:", updatedRepair);

      // Update local state
      setRepairs(repairs.map((r) => (r._id === updatedRepair._id ? updatedRepair : r)));
      setSelectedRepair(updatedRepair);
      setMessage("Cart quantity updated successfully!");
    } catch (err) {
      console.error("Error decreasing cart quantity:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    try {
      // Check if there are any unpaid additional services
      const hasUnpaidServices = selectedRepair.additionalServices &&
        selectedRepair.additionalServices.some(service => !service.isPaid);

      if (hasUnpaidServices) {
        if (!window.confirm("There are unpaid additional services. Do you still want to mark the repair as completed?")) {
          return;
        }
      }

      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairStatus: "Completed" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update repair status");
      }

      const updatedRepair = await response.json();
      console.log("Repair status updated to Completed:", updatedRepair);
      setRepairs(repairs.map((r) => (r._id === updatedRepair._id ? updatedRepair : r)));
      setShowViewModal(false);
      fetchRepairs();
      setMessage("Repair marked as completed successfully!");
    } catch (err) {
      console.error("Error completing payment:", err);
      setError(err.message);
    }
  };

  // Handle changes to the new service form
  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({
      ...newService,
      [name]: name === "discountAmount" ? parseFloat(value) || 0 : value
    });
  };
    // Apply all service discounts
    const handleApplyServiceDiscounts = async () => {
      try {
        if (services.length === 0) {
          setError("No services added. Please add at least one service with a discount.");
          return;
        }
  
        // Calculate total discount amount
        const totalDiscountAmount = services.reduce((total, service) => total + service.discountAmount, 0);
  
        // Calculate cart total and base total
        const cartTotal = selectedRepair.repairCart.reduce((total, item) => total + item.cost, 0);
        const baseTotal = cartTotal + (selectedRepair.repairCost || 0);
  
        // Ensure discount doesn't exceed total cost
        if (totalDiscountAmount > baseTotal) {
          setError("Total discount cannot exceed the total repair cost.");
          return;
        }
  
        // Calculate new total repair cost
        const updatedTotalRepairCost = baseTotal - totalDiscountAmount;
  
        // Calculate final amount (including additional services)
        const totalAdditionalServicesAmount = selectedRepair.totalAdditionalServicesAmount || 0;
        const finalAmount = updatedTotalRepairCost + totalAdditionalServicesAmount;
  
        console.log("Applying service discounts:", services);
        console.log("Total discount amount:", totalDiscountAmount);
        console.log("New total repair cost:", updatedTotalRepairCost);
        console.log("Final amount (including additional services):", finalAmount);
  
        const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            services: services,
            totalDiscountAmount: totalDiscountAmount,
            totalRepairCost: updatedTotalRepairCost,
            finalAmount: finalAmount
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to apply service discounts");
        }
  
        const updatedRepair = await response.json();
        console.log("Updated repair with service discounts:", updatedRepair);
        setRepairs(repairs.map((r) => (r._id === updatedRepair._id ? updatedRepair : r)));
        setSelectedRepair(updatedRepair);
        setMessage("Service discounts applied successfully!");
      } catch (err) {
        console.error("Error applying service discounts:", err);
        setError(err.message);
      }
    };
  
  
  // Add a new service to the list
  const handleAddService = async () => {
    if (!newService.serviceName.trim()) {
      setError("Service name is required");
      return;
    }
  
    if (isNaN(newService.discountAmount) || newService.discountAmount < 0) {
      setError("Discount amount must be a positive number");
      return;
    }
  
    try {
      const updatedServices = [...services, { ...newService }];
      setServices(updatedServices);
      setNewService({ serviceName: "", discountAmount: 0, description: "" });
  
      const cartTotal = selectedRepair.repairCart.reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0);
      const baseTotal = cartTotal + Math.max(0, parseFloat(selectedRepair.repairCost || 0));
      const totalDiscountAmount = updatedServices.reduce((total, service) => total + Math.max(0, parseFloat(service.discountAmount || 0)), 0);
      const totalAdditionalServicesAmount = parseFloat(selectedRepair.totalAdditionalServicesAmount || 0); 
      const updatedTotalRepairCost = Math.max(0, baseTotal - totalDiscountAmount); 
      const finalAmount = updatedTotalRepairCost + totalAdditionalServicesAmount;
      console.log("Calculation details:", { cartTotal, repairCost: selectedRepair.repairCost, totalDiscountAmount, totalAdditionalServicesAmount, updatedTotalRepairCost, finalAmount });
      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: updatedServices,
          totalDiscountAmount,
          totalRepairCost: updatedTotalRepairCost,
          finalAmount
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply service");
      }
  
      const updatedRepair = await response.json();
      setSelectedRepair(updatedRepair);
      setRepairs(repairs.map(r => (r._id === updatedRepair._id ? updatedRepair : r)));
      setMessage("Service added and totals updated successfully!");
    } catch (err) {
      console.error("Error adding service:", err);
      setError(err.message);
    }
  };
    const handleRemoveService = async (index) => {
    try {
      const updatedServices = [...services];
      updatedServices.splice(index, 1);
      setServices(updatedServices);
  
      const totalDiscountAmount = updatedServices.reduce((total, service) => total + service.discountAmount, 0);
      const cartTotal = selectedRepair.repairCart.reduce((total, item) => total + item.cost, 0);
      const baseTotal = cartTotal + (selectedRepair.repairCost || 0);
      const updatedTotalRepairCost = baseTotal - totalDiscountAmount;
      const totalAdditionalServicesAmount = selectedRepair.totalAdditionalServicesAmount || 0;
      const finalAmount = updatedTotalRepairCost + totalAdditionalServicesAmount;
  
      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: updatedServices,
          totalDiscountAmount,
          totalRepairCost: updatedTotalRepairCost,
          finalAmount,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to update after removing service");
  
      const updatedRepair = await response.json();
      setSelectedRepair(updatedRepair);
      setRepairs(repairs.map(r => (r._id === updatedRepair._id ? updatedRepair : r)));
      setMessage("Service removed and totals updated.");
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Handle changes to the new additional service form
  const handleNewAdditionalServiceChange = (e) => {
    const { name, value } = e.target;
    setNewAdditionalService({
      ...newAdditionalService,
      [name]: name === "serviceAmount" ? parseFloat(value) || 0 : value
    });
  };

  // Add a new additional service
  const handleAddAdditionalService = async () => {
    if (!newAdditionalService.serviceName.trim()) {
      setError("Service name is required");
      return;
    }

    if (isNaN(newAdditionalService.serviceAmount) || newAdditionalService.serviceAmount <= 0) {
      setError("Service amount must be a positive number");
      return;
    }

    try {
      setLoading(true); // Show loading indicator
      setError(""); // Clear any previous errors

      // Create a clean service object with proper number conversion
      const serviceToAdd = {
        serviceName: newAdditionalService.serviceName.trim(),
        serviceAmount: parseFloat(newAdditionalService.serviceAmount),
        description: newAdditionalService.description ? newAdditionalService.description.trim() : ""
      };

      console.log("Sending additional service data:", serviceToAdd);

      const response = await fetch(`${API_URL}/add-service/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additionalService: serviceToAdd
        }),
      });

      // First check if response is ok before trying to parse it
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
          } catch (jsonError) {
            // If JSON parsing fails, use the status text
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        } else {
          // For non-JSON error responses
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // If we get here, the response is ok, so try to parse the JSON
      try {
        const responseData = await response.json();
        console.log("Added additional service:", responseData);

        // Update the UI with the new data
        setRepairs(repairs.map((r) => (r._id === responseData._id ? responseData : r)));
        setSelectedRepair(responseData);
        setAdditionalServices(responseData.additionalServices || []);
        setNewAdditionalService({ serviceName: "", serviceAmount: 0, description: "" }); // Reset form
        setMessage("Additional service added successfully!");
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError);
        throw new Error("Server returned an invalid response format. The service may have been added, please refresh the page.");
      }
    } catch (err) {
      console.error("Error adding additional service:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  // Pay for a specific additional service
  const handlePayAdditionalService = async (index) => {
    try {
      setLoading(true); // Show loading indicator
      setError(""); // Clear any previous errors

      console.log("Marking service as paid, index:", index);

      const response = await fetch(`${API_URL}/pay-service/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIndex: index
        }),
      });

      // First check if response is ok before trying to parse it
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
          } catch (jsonError) {
            // If JSON parsing fails, use the status text
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        } else {
          // For non-JSON error responses
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // If we get here, the response is ok, so try to parse the JSON
      try {
        const responseData = await response.json();
        console.log("Marked service as paid:", responseData);

        // Update the UI with the new data
        setRepairs(repairs.map((r) => (r._id === responseData._id ? responseData : r)));
        setSelectedRepair(responseData);
        setAdditionalServices(responseData.additionalServices || []);
        setMessage("Service marked as paid!");
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError);
        throw new Error("Server returned an invalid response format. The service may have been marked as paid, please refresh the page.");
      }
    } catch (err) {
      console.error("Error marking service as paid:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleApplyDiscount = async () => {
    try {
      const discountAmount = parseFloat(discount);
      if (totalDiscountAmount > baseTotal) {
        setError("Total discount cannot exceed the base repair cost.");
        return;
      }  
      const updatedServices = [
        ...services,
        {
          serviceName: "Quick Discount",
          discountAmount,
          description: "Quick discount applied"
        }
      ];
  
      const totalDiscountAmount = updatedServices.reduce((total, service) => total + service.discountAmount, 0);
      const cartTotal = selectedRepair.repairCart.reduce((total, item) => total + item.cost, 0);
      const baseTotal = cartTotal + (selectedRepair.repairCost || 0);
      const updatedTotalRepairCost = baseTotal - totalDiscountAmount;
      const totalAdditionalServicesAmount = selectedRepair.additionalServices
      ? selectedRepair.additionalServices.reduce((total, service) => total + (service.isPaid ? 0 : parseFloat(service.serviceAmount || 0)), 0)
      : 0;
    const finalAmount = updatedTotalRepairCost + totalAdditionalServicesAmount;  
      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: updatedServices,
          totalDiscountAmount,
          totalRepairCost: updatedTotalRepairCost,
          finalAmount
        }),
      });
  
      if (!response.ok) throw new Error("Failed to apply discount");
  
      const updatedRepair = await response.json();
      setSelectedRepair(updatedRepair);
      setRepairs(repairs.map((r) => (r._id === updatedRepair._id ? updatedRepair : r)));
      setServices(updatedRepair.services || []);
      setDiscount(0);
      setMessage("Discount applied and totals updated.");
    } catch (err) {
      setError(err.message);
    }
  };
    
  const calculateCartTotal = (cart) => {
    if (!cart || !Array.isArray(cart)) return "0.00";
    return cart
      .reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0)
      .toFixed(2);
  };
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Job List", 90, 20);
    const tableColumn = [
      "Job Number",
      "Customer Name",
      "Mobile",
      "Device",
      "IMEI/Serial No",
      "Issue Description",
      "Checking Charge",
      "Status",
      "Cart Total",
      "Total Repair Cost",
      "Final Amount",
    ];
    const tableRows = repairs.map((repair) => [
      repair.repairInvoice || repair.repairCode,
      repair.customerName,
      repair.customerPhone || "N/A",
      repair.deviceType || repair.itemName,
      repair.serialNumber || "N/A",
      repair.issueDescription,
      `Rs. ${repair.checkingCharge || 0}`,
      repair.repairStatus,
      `Rs. ${calculateCartTotal(repair.repairCart)}`,
      `Rs. ${repair.totalRepairCost || 0}`,
      `Rs. ${repair.finalAmount || repair.totalRepairCost || 0}`,
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save("Repair_List.pdf");
  };

  const generateExcel = () => {
    const formattedRepairs = repairs.map((repair) => ({
      "Job Number": repair.repairInvoice || repair.repairCode,
      "Customer Name": repair.customerName,
      "Mobile": repair.customerPhone || "N/A",
      "Device": repair.deviceType || repair.itemName,
      "IMEI/Serial No": repair.serialNumber || "N/A",
      "Issue Description": repair.issueDescription,
      "Status": repair.repairStatus,
      "Cart Total": `Rs. ${calculateCartTotal(repair.repairCart)}`,
      "Total Repair Cost": `Rs. ${repair.totalRepairCost || 0}`,
      "Final Amount": `Rs. ${repair.finalAmount || repair.totalRepairCost || 0}`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedRepairs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Repairs");
    XLSX.writeFile(workbook, "Repair_List.xlsx");
  };

  const generateBill = (repair) => {
    const isPaid = isRepairPaid(repair);
    const unpaidServices = repair.additionalServices?.filter(service => !service.isPaid) || [];
    const unpaidServicesAmount = unpaidServices.reduce((total, s) => total + Math.max(0, parseFloat(s.serviceAmount || 0)), 0).toFixed(2);
    const baseRepairCost = parseFloat(repair.totalRepairCost || 0).toFixed(2);
    const actualUnpaidTotal = isPaid ? 0 : parseFloat(baseRepairCost) + parseFloat(unpaidServicesAmount);
  
    const billWindow = window.open("", "_blank");
    billWindow.document.write(`
      <html>
        <head>
          <title>Repair Bill</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 0;
            }
            .bill-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border: 1px solid #ddd;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .details, .totals {
              margin-bottom: 20px;
            }
            .details p, .totals p {
              margin: 5px 0;
              font-size: 14px;
            }
            .details strong, .totals strong {
              display: inline-block;
              width: 150px;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              color: #333;
            }
            .totals {
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .totals p {
              font-weight: bold;
            }
            .print-btn {
              display: block;
              width: 100px;
              margin: 20px auto;
              padding: 10px;
              background-color: #28a745;
              color: white;
              border: none;
              cursor: pointer;
              text-align: center;
            }
            .print-btn:hover {
              background-color: #218838;
            }
            @media print {
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="header">
              <h1>Repair Bill</h1>
              <p>EXXPLAN Repair Services</p>
              <p>456 123 Repair Lane, Tech City, TC 45678</p>
              <p>Phone: (555) 123-4567 | Email: support@exxplan.com</p>
            </div>
            <div class="details">
              <p><strong>Job Number:</strong> ${repair.repairInvoice || repair.repairCode}</p>
              <p><strong>Customer:</strong> ${repair.customerName}</p>
              <p><strong>Phone:</strong> ${repair.customerPhone}</p>
              <p><strong>Device:</strong> ${repair.deviceType || repair.itemName}</p>
              <p><strong>Issue:</strong> ${repair.issueDescription}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                ${repair.repairCart
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.itemCode}</td>
                        <td>${item.itemName}</td>
                        <td>${item.quantity}</td>
                        <td>Rs. ${item.cost}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="totals">
              <p><strong>Cart Total:</strong> Rs. ${calculateCartTotal(repair.repairCart)}</p>
              ${repair.services && repair.services.length > 0 ? `
              <div class="discounts">
                <p><strong>Discounts:</strong></p>
                <ul style="list-style-type: none; padding-left: 20px; margin: 5px 0;">
                  ${repair.services.map(service => `
                    <li>${service.serviceName}: Rs. ${service.discountAmount} ${service.description ? `(${service.description})` : ''}</li>
                  `).join('')}
                </ul>
                <p><strong>Total Discount:</strong> Rs. ${repair.totalDiscountAmount || 0}</p>
              </div>
              ` : ''}
              <p><strong>Total Repair Cost:</strong> Rs. ${repair.totalRepairCost || 0}</p>
              ${repair.additionalServices && repair.additionalServices.length > 0 ? `
              <div class="additional-services">
                <p><strong>Additional Services:</strong></p>
                <ul style="list-style-type: none; padding-left: 20px; margin: 5px 0;">
                  ${repair.additionalServices.map(service => `
                    <li>${service.serviceName}: Rs. ${service.serviceAmount} ${service.description ? `(${service.description})` : ''}${repair.repairStatus !== "Pending" ? service.isPaid ? ' <span style="color: green;">[PAID]</span>' : ' <span style="color: red;">[UNPAID]</span>' : ''}</li>
                  `).join('')}
                </ul>
                <p><strong>Total Additional Services:</strong> Rs. ${repair.totalAdditionalServicesAmount || 0}</p>
              </div>
              ` : ''}
              ${repair.repairStatus !== "Pending" ? `
              <p style="font-size: 16px; font-weight: bold; color: ${isPaid ? 'green' : 'red'}; border-top: 1px solid #ccc; padding-top: 10px;">
                ${isPaid ? '✅ TO BE PAID TOTAL' : '❌ UNPAID TOTAL'}: Rs. ${repair.finalAmount || repair.totalRepairCost || 0}
              </p>
              ` : `
<p style="font-size: 16px; font-weight: bold; color: ${isPaid ? 'green' : 'red'}; border-top: 1px solid #ccc; padding-top: 10px;">
                ${isPaid ? '✅ TO BE PAID TOTAL' : '❌ UNPAID TOTAL'}: Rs. ${repair.finalAmount || repair.totalRepairCost || 0}
              </p>              `}
            </div>
            <button class="print-btn" onclick="window.print()">Print Bill</button>
          </div>
        </body>
      </html>
    `);
    billWindow.document.close();
  };

  const generateJobBill = (repair) => {
    console.log("Generating new bill with repair data:", repair); // Debug log
    // Create a new PDF document in portrait mode, A4 size
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Define colors to match the screenshot
    const black = [0, 0, 0];
    const lightGray = [240, 240, 240];
    const lightBlue = [230, 240, 250]; // Background color for footer
    const darkGray = [50, 50, 50];
    const Gray = [100, 100, 100];

    // Custom dashed line function
    const drawDashedLine = (x1, y1, x2, y2, dashLength = 2) => {
      const deltaX = x2 - x1;
      const deltaY = y2 - y1;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const dashCount = Math.floor(distance / (dashLength * 2));
      const xStep = deltaX / (dashCount * 2);
      const yStep = deltaY / (dashCount * 2);

      for (let i = 0; i < dashCount * 2; i += 2) {
        const startX = x1 + (i * xStep);
        const startY = y1 + (i * yStep);
        const endX = x1 + ((i + 1) * xStep);
        const endY = y1 + ((i + 1) * yStep);
        doc.line(startX, startY, endX, endY);
      }
    };

    // Function to check and add a new page if needed
    const checkPageBreak = (currentY, spaceNeeded, addFooter = false) => {
      const pageHeight = 297; // A4 height in mm
      const bottomMargin = addFooter ? 30 : 10; // Reserve space for footer if needed
      if (currentY + spaceNeeded > pageHeight - bottomMargin) {
        if (addFooter) {
          doc.setFillColor(...lightBlue);
          doc.rect(0, pageHeight - 30, 210, 30, 'F'); // Add footer on current page
        }
        doc.addPage();
        return 10; // Start at the top of the new page
      }
      return currentY;
    };

    // Add header with light gray background
    doc.setFillColor(...lightGray);
    doc.rect(0, 0, 210, 50, 'F');

    // Add company name and tagline
    doc.setTextColor(...black);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EXXPLAN Repair Services", 105, 25, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Trusted Repair Partner", 105, 30, { align: "center" });

    // Add company contact info
    doc.setTextColor(...Gray);
    doc.text("EXXPLAN Repair Services Pvt Ltd", 183, 55);
    doc.text("No 422, Thimbirigasyaya Road, Colombo 05", 138, 60);
    doc.text("(+94)77 2025 330", 179, 65);

    // Add job sheet title and details
    doc.setFontSize(12);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("JOB SHEET", 20, 55);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...Gray);
    doc.text(`SERVICE JOB NO: ${repair.repairInvoice || repair.repairCode || 'REP14'}`, 20, 65);
    doc.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, 20, 70); // 19/05/2025
    doc.text(`TIME: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`, 20, 75); // 20:31

    // Add customer and device information table
    let tableY = doc.lastAutoTable.finalY + 10;
    tableY = checkPageBreak(tableY, 20);
    doc.autoTable({
      startY: 90,
      head: [["Customer Name:", "Device:", "IMEI/SN:", "Contact Number:"]],
      body: [
        [
          repair.customerName || 'test test',
          repair.deviceType || repair.itemName || 'test dev',
          repair.serialNumber || 'S300',
          repair.customerPhone || '0774096667'
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, textColor: Gray },
      headStyles: { fillColor: lightGray, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      },
      margin: { left: 20, right: 20 },
      pageBreak: 'auto' // Enable automatic page breaks
    });

    // Add job description table
    let jobDescTableY = doc.lastAutoTable.finalY + 10;
    jobDescTableY = checkPageBreak(jobDescTableY, 20); // Check if we need a new page for the table
    doc.autoTable({
      startY: jobDescTableY,
      head: [["Device Issue/Issues", "Checking Charge", "Estimation Value (Rs.)"]],
      body: [
        [
          repair.issueDescription || 'Battery failure',
          `Rs. ${repair.checkingCharge || '2000'}`,
          `Rs. ${repair.estimationValue || '50'}`
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, textColor: black }, // Reduced font size
      headStyles: { fillColor: lightGray, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 }, // Reduced width to prevent cutoff
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      pageBreak: 'auto' // Enable automatic page breaks
    });

    // Add terms and conditions
    let termsY = doc.lastAutoTable.finalY + 10;
    termsY = checkPageBreak(termsY, 15); // Check if we need a new page for the header
    doc.setFontSize(8); // Reduced font size to fit more content
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...Gray);
    doc.text("TERMS & CONDITIONS FOR THE REPAIR OF DEVICES", 20, termsY);
    termsY += 4;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...Gray); // Set text color to dark gray
    const terms = [
      "1. The customer should receive a job sheet when an unit is handed over for repairs to EXXPLAN Repair Services Pvt Ltd and the contents filled in should be verified by the customer.",
      "2. The customer should produce the original job sheet at the time of collecting the unit. EXXPLAN Repair Services Pvt Ltd reserves the right to refuse to return upon non-availability of the original job sheet.",
      "3. Units repaired by EXXPLAN Repair Services Pvt Ltd are warranted for a period of 1(one) month from the date of collection of the unit by the customer.",
      "4. EXXPLAN Repair Services Pvt Ltd ensures that all units are repaired within 7(seven) from the date of the damaged unit has been handed over.",
      "5. The customer should collect the repaired unit within 14(Fourteen) days and if the unit is beyond repair our team will keep you informed and make necessary arrangements to collect the same.",
      "6. EXXPLAN Repair Services Pvt Ltd will not be responsible or liable for any units not collected within days from the date of the job sheet issued.",
      "7. EXXPLAN Repair Services Pvt Ltd will not be responsible for any damage or breakdown incurred during the process of repairing the unit.",
      "8. The customer is deemed to accept all Terms & Conditions mentioned in the job sheet."
    ];
    terms.forEach((term, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${term}`, 170); // Split long text
      termsY = checkPageBreak(termsY, lines.length * 4); // Check for each line
      doc.text(lines, 20, termsY);
      termsY += lines.length * 4;
    });

    // Add additional notes section
    let notesY = termsY + 5;
    notesY = checkPageBreak(notesY, 10); // Check for additional notes
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes", 20, notesY);
    doc.setFont("helvetica", "normal");

    // Add signature lines
    let signatureY = notesY + 20;
    signatureY = checkPageBreak(signatureY, 15, true); // Check for signatures, reserve space for footer
    doc.setLineWidth(0.5);
    doc.setDrawColor(...black);
    drawDashedLine(20, signatureY, 100, signatureY, 2); // Customer signature
    drawDashedLine(110, signatureY, 190, signatureY, 2); // Authorized signature
    doc.setFontSize(8);
    doc.text("Customer Signature", 60, signatureY + 5, { align: "center" });
    doc.text("Authorized Signature", 150, signatureY + 5, { align: "center" });

    // Add light blue footer on the last page
    const pageHeight = 297;
    doc.setFillColor(...lightBlue);
    doc.rect(0, pageHeight - 30, 210, 30, 'F');

    // Save the PDF
    doc.save(`JobSheet_${repair.repairInvoice || repair.repairCode || 'REP14'}_${Date.now()}.pdf`);
  };

  // const filteredRepairs = repairs.filter((repair) =>
  //   (repair.repairInvoice || repair.repairCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (repair.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (repair.customerPhone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (repair.deviceType || repair.itemName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (repair.issueDescription || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (repair.serialNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredProducts = products.filter((product) =>
    product.itemCode.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.itemName.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  // Add this function after the other handler functions
  const handleAddReview = async (repair) => {
    console.log("Opening review modal for repair:", repair);
    setSelectedReviewRepair(repair);
    setTechnicianReview(repair.technicianReview || "");
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      setLoading(true);
      setError("");

      // Get the current user's name from localStorage
      const username = localStorage.getItem('username') || 'System';

      // Create a change history entry for the review
      const changeEntry = {
        changedAt: new Date().toISOString(),
        changedBy: username,
        field: 'technicianReview',
        oldValue: selectedReviewRepair.technicianReview || 'No review',
        newValue: technicianReview,
        changeType: 'UPDATE'
      };

      const requestBody = {
        technicianReview: technicianReview,
        changeHistory: [...(selectedReviewRepair.changeHistory || []), changeEntry],
        changedBy: username
      };

      const response = await fetch(`${API_URL}/${selectedReviewRepair._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Review update failed:", errorData);
        throw new Error(errorData.message || "Failed to update review");
      }

      const updatedRepair = await response.json();
      console.log("Review update successful:", updatedRepair);

      // Update the repairs list with the new review
      setRepairs(prevRepairs => {
        const newRepairs = prevRepairs.map(r =>
          r._id === updatedRepair._id ? { ...updatedRepair } : r
        );
        return newRepairs;
      });

      // Update the selected repair if it's currently being viewed
      if (selectedRepair && selectedRepair._id === updatedRepair._id) {
        setSelectedRepair(updatedRepair);
      }

      setShowReviewModal(false);
      setMessage("Technician review updated successfully!");

      // Fetch repairs again to ensure all data is consistent
      await fetchRepairs();

    } catch (err) {
      console.error("Error updating review:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // <div className="status-filter-tabs" style={{
  //   display: 'flex',
  //   justifyContent: 'center',
  //   margin: '20px 0',
  //   gap: '10px',
  //   flexWrap: 'wrap'
  // }}>
  //   {statusFilters.map((status) => (
  //     <button
  //       key={status}
  //       onClick={() => {
  //         setCurrentStatusFilter(status);
  //         setCurrentPage(1);
  //       }}
  //       className={`status-filter-btn ${currentStatusFilter === status ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
  //       style={{
  //         padding: '10px 20px',
  //         borderRadius: '5px',
  //         border: 'none',
  //         backgroundColor: currentStatusFilter === status
  //           ? (darkMode ? '#1a68bc' : '#3182ce')
  //           : (darkMode ? '#4a5568' : '#e2e8f0'),
  //         color: currentStatusFilter === status ? '#fff' : (darkMode ? '#e2e8f0' : '#2d3748'),
  //         cursor: 'pointer',
  //         fontWeight: '500',
  //         transition: 'all 0.2s'
  //       }}
  //     >
  //       {status} ({repairs.filter(r => status === "All" || r.repairStatus === status).length})
  //     </button>
  //   ))}
  // </div>
  // Update the review display in the table
  const renderReview = (repair) => {
    console.log("Rendering review for repair:", {
      id: repair._id,
      review: repair.technicianReview
    });

    if (repair.technicianReview && repair.technicianReview.trim() !== "") {
      return (
        <div className="review-text" title={repair.technicianReview}>
          <div className="review-preview">
            {repair.technicianReview.length > 50
              ? repair.technicianReview.substring(0, 50) + "..."
              : repair.technicianReview}
          </div>
          <div className="review-tooltip">
            {repair.technicianReview}
          </div>
        </div>
      );
    }
    return <span className="no-review">No review</span>;
  };

  // Modify the status update handler
  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      setError("");

      // Get the current user's name from localStorage
      const username = localStorage.getItem('username') || 'System';

      // Create a change history entry
      const changeEntry = {
        changedAt: new Date().toISOString(),
        changedBy: username,
        field: 'repairStatus',
        oldValue: selectedRepair.repairStatus,
        newValue: newStatus,
        changeType: 'UPDATE'
      };

      const response = await fetch(`${API_URL}/${selectedRepair._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          repairStatus: newStatus,
          changedBy: username,
          changeHistory: [...(selectedRepair.changeHistory || []), changeEntry]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Status update failed:", errorData);
        throw new Error(errorData.message || "Failed to update status");
      }

      const updatedRepair = await response.json();
      console.log("Status update successful:", updatedRepair);

      // Update both the repairs list and selected repair
      setRepairs(prevRepairs => {
        const updatedRepairs = prevRepairs.map(r =>
          r._id === updatedRepair._id ? updatedRepair : r
        );
        console.log("Updated repairs list:", updatedRepairs);
        return updatedRepairs;
      });

      setSelectedRepair(prevRepair => {
        const updated = { ...prevRepair, ...updatedRepair };
        console.log("Updated selected repair:", updated);
        return updated;
      });

      setMessage("Repair status updated successfully!");
    } catch (err) {
      console.error("Error updating repair status:", err);
      setError(err.message || "Failed to update repair status");
    } finally {
      setLoading(false);
    }
  };
 

  // Add this function to handle cashier changes view
  const handleViewCashierChanges = () => {
    console.log("Starting to collect cashier changes...");

    // Collect all changes from all repairs
    const allChanges = repairs.reduce((acc, repair) => {
      if (repair && repair.changeHistory && Array.isArray(repair.changeHistory)) {
        const repairChanges = repair.changeHistory.map(change => ({
          ...change,
          repairId: repair._id,
          repairInvoice: repair.repairInvoice || repair.repairCode || 'N/A',
          customerName: repair.customerName || 'N/A',
          deviceType: repair.deviceType || repair.itemName || 'N/A',
          timestamp: new Date(change.changedAt).toLocaleString(),
          changedBy: change.changedBy || 'System',
          field: change.field || 'Unknown Field',
          oldValue: change.oldValue !== undefined ? change.oldValue : 'N/A',
          newValue: change.newValue !== undefined ? change.newValue : 'N/A',
          changeType: change.changeType || 'UPDATE'
        }));
        return [...acc, ...repairChanges];
      }
      return acc;
    }, []);

    // Group changes by cashier
    const changesByCashier = allChanges.reduce((acc, change) => {
      const cashier = change.changedBy;
      if (!acc[cashier]) {
        acc[cashier] = [];
      }
      acc[cashier].push(change);
      return acc;
    }, {});

    // Sort changes within each cashier group by date (newest first)
    Object.keys(changesByCashier).forEach(cashier => {
      changesByCashier[cashier].sort((a, b) =>
        new Date(b.changedAt) - new Date(a.changedAt)
      );
    });

    setCashierChanges(changesByCashier);
    setShowCashierChangesModal(true);
  };

  return (

    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
          JOB LIST
        </h2>
      </div>
      {/* <div className={`search-action-container ${darkMode ? 'dark' : ''}`}> */}
        {/* <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search... "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`product-repair-list-search-bar ${darkMode ? 'dark' : ''}`}
          />
           {searchTerm && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              ✕
            </button>
          )}
        </div> */}
        <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? "dark" : ""}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Item Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`product-list-search-bar ${darkMode ? "dark" : ""}`}
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              ✕
            </button>
          )}
        </div>
          <div className="filter-action-row">
        <div className="status-filter-dropdown" style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '20px 0',
          flexWrap: 'wrap'
        }}>
          <select
            value={currentStatusFilter}
            onChange={e => {
              setCurrentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            className={`status-filter-select ${darkMode ? 'dark' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
              backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
              color: darkMode ? '#e2e8f0' : '#2d3748',
                fontWeight: '500',
              fontSize: '16px',
              minWidth: '180px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
              marginRight: '10px'
            }}
          >
            {statusFilters.map((status) => (
              <option key={status} value={status}>
              {status} ({repairs.filter(r => status === "All" || r.repairStatus === status).length})
              </option>
          ))}
          </select>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} /> Add Repair
        </button>
        <button onClick={() => setShowReportOptions(true)} className="btn-report">
          <FontAwesomeIcon icon={faFile} /> Reports
        </button>
          </div>
        {localStorage.getItem('role') === 'admin' && (
          <button
            onClick={handleViewCashierChanges}
            className={`view-history-btn ${darkMode ? 'dark' : ''}`}
          >
            <FontAwesomeIcon icon={faHistory} />&nbsp; View Cashier Changes
          </button>
        )}
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3 className="report-modal-title">Select Report Type</h3>
              <button
                onClick={() => setShowReportOptions(false)}
                className="report-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="report-modal-buttons">
              <button onClick={generateExcel} className="btn-report" style={{ background: 'green' }}>
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button onClick={generatePDF} className="btn-report" style={{ background: 'red' }}>
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>

              {/* Select Report Type      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header" >
              <h3 className="sup-report-modal-title" >Select Report Type</h3>
              <button
                onClick={() => setShowReportOptions(false)}
                className="report-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="report-modal-buttons">
              <button
                onClick={generateExcel}
                className="btn-report-e"
                style={{ background: 'green' }}
              >
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="btn-report-p"
                style={{ background: 'red' }}

              >
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}

 */}
            </div>
          </div>
        </div>
      )}







      {error && (<p className="error-message">{error}</p>)}
      {message && <p className="success-message">{message}</p>}
      {loading ? (
  <p className="loading">Loading repairs...</p>
) : filteredRepairs.length === 0 ? (
  <p className="no-repairs">No repair records available.</p>
) : currentStatusFilter === "All" ? (
  statusFilters
    .filter(status => status !== "All")
    .map(status => {
      const repairsByStatus = repairs.filter(r => r.repairStatus === status);
      if (repairsByStatus.length === 0) return null;
      return (
        <div key={status} style={{ marginBottom: '40px' }}>
          <h3 style={{ textAlign: "left", color: darkMode ? "#e2e8f0" : "#2d3748", marginBottom: '10px' }}>
            {status} ({repairsByStatus.length})
          </h3>
          <div className="table-responsive">

          <table className={`repair-table ${darkMode ? "dark" : ""}`}>
            <thead>
              <tr>
                <th>Job Number</th>
                <th>Customer Name</th>
                <th>Mobile</th>
                <th>Device</th>
                <th>IMEI/Serial No</th>
                <th>Issue Description</th>
                <th>Status</th>
                <th>Action</th>
                <th>Technician Review</th>
              </tr>
            </thead>
            <tbody>
              {repairsByStatus.map((repair) => (
                <tr key={repair._id}>
                  <td data-label="Job Number">{repair.repairInvoice || repair.repairCode}</td>
                  <td data-label="Customer Name">{repair.customerName}</td>
                  <td data-label="Mobile">{repair.customerPhone || "N/A"}</td>
                  <td data-label="Device">{repair.deviceType || repair.itemName}</td>
                  <td data-label="IMEI/Serial No">{repair.serialNumber || "N/A"}</td>
                  <td data-label="Issue Description">{repair.issueDescription}</td>
                  <td data-label="Status">{repair.repairStatus}</td>
                  <td data-label="Action">
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === repair._id ? null : repair._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === repair._id && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleView(repair)} className="view-btn">
                          <div className="action-btn-content">
                            <img src={viewicon} alt="view" width="20" height="20" className="p-view-btn-icon" />
                            <span>View</span>
                          </div>
                        </button>
                        {repair.repairStatus !== "Completed" && (
                          <button
                            onClick={() => handleSelectProducts(repair)}
                            className="select-btn"
                          >
                            <div className="action-btn-content">
                              <img src={selecticon} alt="select" width="20" height="20" className="p-select-btn-icon" />
                              <span>Select</span>
                            </div>
                          </button>
                        )}
                        <button onClick={() => handleEdit(repair)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={edticon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(repair._id)} className="p-delete-btn">
                          <div className="action-btn-content">
                            <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                            <span>Delete</span>
                          </div>
                        </button>
                        <button onClick={() => generateBill(repair)} className="p-bill-btn">
                          <div className="action-btn-content">
                            <img src={paymenticon} alt="bill" width="30" height="30" className="p-bill-btn-icon" />
                            <span>Bill</span>
                          </div>
                        </button>
                        <button onClick={() => generateJobBill(repair)} className="p-job-bill-btn">
                          <div className="action-btn-content">
                            <img src={jobBillIcon} alt="job bill" width="30" height="30" className="p-job-bill-btn-icon" />
                            <span>JobBill</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                  <td data-label="Technician Review">
                  <div className="review-container">
                    {localStorage.getItem('role') !== 'admin' && (
                      <span>{repair.technicianReview || 'No review added yet'}</span>
                    )}
                    {localStorage.getItem('role') === 'admin' && (
                      <button
                        onClick={() => handleAddReview(repair)}
                        className={`review-btn ${darkMode ? "dark" : ""}`}
                      >
                        {repair.technicianReview ? "Review" : "Add Review"}
                      </button>
                    )}
                  </div>
                </td>
                 </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      );
    })
) : (
  <div className="table-responsive">

  <table className={`repair-table ${darkMode ? "dark" : ""}`}>
    <thead>
      <tr>
        <th>Job Number</th>
        <th>Customer Name</th>
        <th>Mobile</th>
        <th>Device</th>
        <th>IMEI/Serial No</th>
        <th>Issue Description</th>
        <th>Status</th>
        <th>Action</th>
        <th>Technician Review</th>
      </tr>
    </thead>
    <tbody>
      {currentItems.map((repair) => (
        <tr key={repair._id}>
          <td data-label="Job Number">{repair.repairInvoice || repair.repairCode}</td>
          <td data-label="Customer Name">{repair.customerName}</td>
          <td data-label="Mobile">{repair.customerPhone || "N/A"}</td>
          <td data-label="Device">{repair.deviceType || repair.itemName}</td>
          <td data-label="IMEI/Serial No">{repair.serialNumber || "N/A"}</td>
          <td data-label="Issue Description">{repair.issueDescription}</td>
          <td data-label="Status">{repair.repairStatus}</td>
          <td data-label="Action">
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === repair._id ? null : repair._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === repair._id && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleView(repair)} className="view-btn">
                          <div className="action-btn-content">
                            <img src={viewicon} alt="view" width="20" height="20" className="p-view-btn-icon" />
                            <span>View</span>
                          </div>
                        </button>
                        {repair.repairStatus !== "Completed" && (
                          <button
                            onClick={() => handleSelectProducts(repair)}
                            className="select-btn"
                          >
                            <div className="action-btn-content">
                              <img src={selecticon} alt="select" width="20" height="20" className="p-select-btn-icon" />
                              <span>Select</span>
                            </div>
                          </button>
                        )}
                        <button onClick={() => handleEdit(repair)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={edticon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(repair._id)} className="p-delete-btn">
                          <div className="action-btn-content">
                            <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                            <span>Delete</span>
                          </div>
                        </button>
                        <button onClick={() => generateBill(repair)} className="p-bill-btn">
                          <div className="action-btn-content">
                            <img src={paymenticon} alt="bill" width="30" height="30" className="p-bill-btn-icon" />
                            <span>Bill</span>
                          </div>
                        </button>
                        <button onClick={() => generateJobBill(repair)} className="p-job-bill-btn">
                          <div className="action-btn-content">
                            <img src={jobBillIcon} alt="job bill" width="30" height="30" className="p-job-bill-btn-icon" />
                            <span>JobBill</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
          <td data-label="Technician Review">
                  <div className="review-container">
                    {localStorage.getItem('role') !== 'admin' && (
                      <span>{repair.technicianReview || 'No review added yet'}</span>
                    )}
                    {localStorage.getItem('role') === 'admin' && (
                      <button
                        onClick={() => handleAddReview(repair)}
                        className={`review-btn ${darkMode ? "dark" : ""}`}
                      >
                        {repair.technicianReview ? "Review" : "Add Review"}
                      </button>
                    )}
                  </div>
                </td>
         </tr>
      ))}
    </tbody>
  </table>
  </div>
)}

      {showEditModal && selectedRepair && (
        <EditProductRepair
          repair={selectedRepair}
          closeModal={() => {
            setShowEditModal(false);
            fetchRepairs();
          }}
          darkMode={darkMode}
        />
      )}

      {showViewModal && selectedRepair && (
        <div className="view-modal">
          <div className="modal-content">
            <div style={{
              textAlign: "center",
              marginBottom: "20px",
              backgroundColor: darkMode ? "#444" : "#f8f9fa",
              padding: "15px",
              borderRadius: "5px"
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "24px",
                color: darkMode ? "#fff" : "#333",
                fontWeight: "bold"
              }}>
                Product Repair Details
              </h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "20px"
            }}>
              <div style={{ backgroundColor: darkMode ? "#555" : "#fff", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <strong style={{ color: darkMode ? "#ddd" : "#555", display: "block", marginBottom: "5px" }}>Customer Name:</strong>
                <span style={{ color: darkMode ? "#fff" : "#333" }}>{selectedRepair.customerName}</span>
              </div>
              <div style={{ backgroundColor: darkMode ? "#555" : "#fff", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <strong style={{ color: darkMode ? "#ddd" : "#555", display: "block", marginBottom: "5px" }}>Customer Phone:</strong>
                <span style={{ color: darkMode ? "#fff" : "#333" }}>{selectedRepair.customerPhone}</span>
              </div>
              <div style={{ backgroundColor: darkMode ? "#555" : "#fff", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <strong style={{ color: darkMode ? "#ddd" : "#555", display: "block", marginBottom: "5px" }}>Device:</strong>
                <span style={{ color: darkMode ? "#fff" : "#333" }}>{selectedRepair.deviceType || selectedRepair.itemName}</span>
              </div>
              <div style={{ backgroundColor: darkMode ? "#555" : "#fff", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <strong style={{ color: darkMode ? "#ddd" : "#555", display: "block", marginBottom: "5px" }}>Issue Description:</strong>
                <span style={{ color: darkMode ? "#fff" : "#333" }}>{selectedRepair.issueDescription}</span>
              </div>

              <div style={{ backgroundColor: darkMode ? "#555" : "#fff", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <strong style={{ color: darkMode ? "#ddd" : "#555", display: "block", marginBottom: "5px" }}>Repair Status:</strong>
                <select
                  value={selectedRepair.repairStatus}
                  onChange={async (e) => {
                    try {
                      const newStatus = e.target.value;
                      setLoading(true);
                      setError("");

                      // Log the update attempt
                      console.log("Attempting to update repair status:", {
                        repairId: selectedRepair._id,
                        newStatus: newStatus,
                        currentStatus: selectedRepair.repairStatus
                      });

                      handleStatusUpdate(newStatus);
                    } catch (err) {
                      console.error("Error updating repair status:", err);
                      setError(err.message || "Failed to update repair status");
                      // Revert the select value to the previous status
                      setSelectedRepair(prevRepair => ({
                        ...prevRepair,
                        repairStatus: prevRepair.repairStatus
                      }));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    backgroundColor: darkMode ? "#444" : "#fff",
                    color: darkMode ? "#fff" : "#333",
                    width: "100%",
                    marginTop: "5px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {loading && (
                  <div style={{
                    marginTop: "5px",
                    color: darkMode ? "#63b3ed" : "#3182ce",
                    fontSize: "14px",
                    textAlign: "center"
                  }}>
                    Updating status...
                  </div>
                )}
                {error && (
                  <div style={{
                    marginTop: "5px",
                    color: "#e53e3e",
                    fontSize: "14px",
                    textAlign: "center"
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{
                fontSize: "18px",
                color: darkMode ? "#ddd" : "#ddd",
                marginBottom: "10px",
                borderBottom: `2px solid ${darkMode ? "#666" : "#ddd"}`,
                paddingBottom: "5px"
              }}>
                Repair Cart
              </h3>
              {selectedRepair && selectedRepair.repairCart && Array.isArray(selectedRepair.repairCart) && selectedRepair.repairCart.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: darkMode ? "#444" : "#fff" }}>
                  <thead>
                    <tr style={{
                      backgroundColor: darkMode ? "#555" : "#f2f2f2",
                      color: darkMode ? "#fff" : "#333"
                    }}>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Item Code</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Item Name</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Quantity</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Cost</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRepair.repairCart.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? (darkMode ? "#4a4a4a" : "#fafafa") : (darkMode ? "#444" : "#fff") }}>
                        <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{item.itemCode}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{item.itemName}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{item.quantity}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>Rs. {item.cost}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>
                          {selectedRepair.repairStatus !== "Completed" && (
                            <button
                              onClick={() => handleDecreaseCartQuantity(index)}
                              className="quantity-btn"
                              disabled={loading}
                              title="Decrease quantity"
                              style={{
                                backgroundColor: "#e74c3c",
                                color: "white",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "3px",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                marginRight: "5px"
                              }}
                            >
                              -
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: darkMode ? "#ccc" : "#666", fontStyle: "italic" }}>No items in cart.</p>
              )}            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: `1px solid ${darkMode ? "#666" : "#ddd"}`
            }}>
              <p style={{ margin: 0, fontWeight: "bold", color: darkMode ? "#ddd" : "#ddd" }}>
                Cart Total: <span style={{ color: darkMode ? "#fff" : "#fff" }}>Rs. {calculateCartTotal(selectedRepair.repairCart)}</span>
              </p>
              <p style={{ margin: 0, fontWeight: "bold", color: darkMode ? "#ddd" : "#ddd" }}>
                Total Repair Cost: <span style={{ color: darkMode ? "#fff" : "#fff" }}>Rs. {(selectedRepair.totalRepairCost || 0).toFixed(2)}</span>
              </p>
            </div>
            {selectedRepair.repairStatus !== "Completed" && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{
                  fontSize: "18px",
                  color: darkMode ? "#ddd" : "#555",
                  marginBottom: "10px",
                  borderBottom: `2px solid ${darkMode ? "#666" : "#ddd"}`,
                  paddingBottom: "5px"
                }}>
                  Services & Discounts
                </h3>

                {/* Services List */}
                {selectedRepair && selectedRepair.services && Array.isArray(selectedRepair.services) && selectedRepair.services.length > 0 ? (
                  <div style={{ marginBottom: "15px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: darkMode ? "#444" : "#fff" }}>
                      <thead>
                        <tr style={{
                          backgroundColor: darkMode ? "#555" : "#f2f2f2",
                          color: darkMode ? "#fff" : "#333"
                        }}>
                          <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Service Name</th>
                          <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Discount Amount</th>
                          <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Description</th>
                          <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRepair.services.map((service, index) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? (darkMode ? "#4a4a4a" : "#fafafa") : (darkMode ? "#444" : "#fff") }}>
                            <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{service.serviceName}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>Rs. {service.discountAmount}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{service.description || "N/A"}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>
                            <button
  onClick={() => handleRemoveService(index)}  // ✅ Add this line
  style={{
    backgroundColor: "rgb(231, 76, 60)",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "3px",
    cursor: "pointer"
  }}
>
  Remove
</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: darkMode ? "#ccc" : "#666", fontStyle: "italic", marginBottom: "15px" }}>No services or discounts added yet.</p>
                )}

                {/* Add New Service Form */}
                <div style={{
                  backgroundColor: darkMode ? "#333" : "#f9f9f9",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "15px"
                }}>
                  <h4 style={{
                    margin: "0 0 10px 0",
                    color: darkMode ? "#ddd" : "#333",
                    fontSize: "16px"
                  }}>
                    Add New Discount
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "5px",
                        color: darkMode ? "#ccc" : "#555",
                        fontSize: "14px"
                      }}>
                        Service Name:
                      </label>
                      <input
                        type="text"
                        name="serviceName"
                        value={newService.serviceName}
                        onChange={handleNewServiceChange}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          backgroundColor: darkMode ? "#444" : "#fff",
                          color: darkMode ? "#fff" : "#333"
                        }}
                        placeholder="e.g., Screen Repair"
                      />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "5px",
                        color: darkMode ? "#ccc" : "#555",
                        fontSize: "14px"
                      }}>
                        Discount Amount (Rs.):
                      </label>
                      <input
                        type="number"
                        name="discountAmount"
                        min="0"
                        value={newService.discountAmount}
                        onChange={handleNewServiceChange}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          backgroundColor: darkMode ? "#444" : "#fff",
                          color: darkMode ? "#fff" : "#333"
                        }}
                      />
                    </div>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "5px",
                        color: darkMode ? "#ccc" : "#555",
                        fontSize: "14px"
                      }}>
                        Description (Optional):
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={newService.description}
                        onChange={handleNewServiceChange}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          backgroundColor: darkMode ? "#444" : "#fff",
                          color: darkMode ? "#fff" : "#333"
                        }}
                        placeholder="e.g., Special discount for loyal customer"
                      />
                    </div>
                    <div>
                      <button
                        onClick={handleAddService}
                        style={{
                          backgroundColor: "#3498db",
                          color: "white",
                          border: "none",
                          padding: "8px 15px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          height: "36px"
                        }}
                      >
                        Add Discount
                      </button>
                    </div>
                  </div>
                </div>

                {/* Legacy Discount (kept for backward compatibility)
                <div style={{
                  backgroundColor: darkMode ? "#333" : "#f9f9f9",
                  padding: "15px",
                  borderRadius: "5px"
                }}>
                  <h4 style={{
                    margin: "0 0 10px 0",
                    color: darkMode ? "#ddd" : "#333",
                    fontSize: "16px"
                  }}> */}
                    {/* Quick Discount
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ color: darkMode ? "#ddd" : "#555" }}>
                      Amount (Rs.):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className={`product-repair-list-input ${darkMode ? "dark" : ""}`}
                      style={{
                        width: "100px",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        backgroundColor: darkMode ? "#444" : "#fff",
                        color: darkMode ? "#fff" : "#333"
                      }}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      style={{
                        backgroundColor: "#f39c12",
                        color: "white",
                        border: "none",
                        padding: "8px 15px",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Apply Quick Discount
                    </button>
                  </div>
                </div>
              </div>
            )} */}

             </div>
            )}

            {/* Additional Services Section - Always visible, even for completed repairs */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{
                fontSize: "18px",
                color: darkMode ? "#ddd" : "#555",
                marginBottom: "10px",
                borderBottom: `2px solid ${darkMode ? "#666" : "#ddd"}`,
                paddingBottom: "5px"
              }}>
                Additional Services
              </h3>

              {/* Additional Services List */}
              {additionalServices.length > 0 ? (
                <div style={{ marginBottom: "15px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: darkMode ? "#444" : "#fff" }}>
                    <thead>
                      <tr style={{
                        backgroundColor: darkMode ? "#555" : "#f2f2f2",
                        color: darkMode ? "#fff" : "#333"
                      }}>
                        <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Service Name</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Amount</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Description</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Status</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontWeight: "bold" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionalServices.map((service, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? (darkMode ? "#4a4a4a" : "#fafafa") : (darkMode ? "#444" : "#fff") }}>
                          <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{service.serviceName}</td>
                          <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>Rs. {service.serviceAmount}</td>
                          <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>{service.description || "N/A"}</td>
                          <td style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            color: service.isPaid ? "#28a745" : "#dc3545",
                            fontWeight: "bold"
                          }}>
                            {service.isPaid ? "PAID" : "UNPAID"}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "10px", color: darkMode ? "#fff" : "#333" }}>
                            {!service.isPaid && (
                              <button
                                onClick={() => handlePayAdditionalService(index)}
                                style={{
                                  backgroundColor: "#28a745",
                                  color: "white",
                                  border: "none",
                                  padding: "5px 10px",
                                  borderRadius: "3px",
                                  cursor: "pointer"
                                }}
                              >
                                Mark as Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: darkMode ? "#333" : "#e9e9e9" }}>
                        <td colSpan="4" style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right", fontWeight: "bold", color: darkMode ? "#fff" : "#333" }}>
                          Total Additional Services:
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", fontWeight: "bold", color: darkMode ? "#fff" : "#333" }}>
  Rs. {additionalServices.reduce((total, service) => total + (service.isPaid ? 0 : Math.max(0, parseFloat(service.serviceAmount || 0))), 0).toFixed(2)}
</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p style={{ color: darkMode ? "#ccc" : "#666", fontStyle: "italic", marginBottom: "15px" }}>No additional services added yet.</p>
              )}

              {/* Add New Additional Service Form */}
              <div style={{
                backgroundColor: darkMode ? "#333" : "#f9f9f9",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "15px"
              }}>
                <h4 style={{
                  margin: "0 0 10px 0",
                  color: darkMode ? "#ddd" : "#333",
                  fontSize: "16px"
                }}>
                  Add New Additional Service
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      color: darkMode ? "#ccc" : "#555",
                      fontSize: "14px"
                    }}>
                      Service Name:
                    </label>
                    <input
                      type="text"
                      name="serviceName"
                      value={newAdditionalService.serviceName}
                      onChange={handleNewAdditionalServiceChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        backgroundColor: darkMode ? "#444" : "#fff",
                        color: darkMode ? "#fff" : "#333"
                      }}
                      placeholder="e.g., Screen Protector"
                    />
                  </div>
                  <div style={{ flex: "1 1 150px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      color: darkMode ? "#ccc" : "#555",
                      fontSize: "14px"
                    }}>
                      Service Amount (Rs.):
                    </label>
                    <input
                      type="number"
                      name="serviceAmount"
                      min="0"
                      value={newAdditionalService.serviceAmount}
                      onChange={handleNewAdditionalServiceChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        backgroundColor: darkMode ? "#444" : "#fff",
                        color: darkMode ? "#fff" : "#333"
                      }}
                    />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "5px",
                      color: darkMode ? "#ccc" : "#555",
                      fontSize: "14px"
                    }}>
                      Description (Optional):
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={newAdditionalService.description}
                      onChange={handleNewAdditionalServiceChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        backgroundColor: darkMode ? "#444" : "#fff",
                        color: darkMode ? "#fff" : "#333"
                      }}
                      placeholder="e.g., Premium tempered glass"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleAddAdditionalService}
                      style={{
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "8px 15px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        height: "36px"
                      }}
                    >
                      Add Service
                    </button>
                  </div>
                </div>
              </div>

              {/* Final Amount Display */}
              {(selectedRepair.totalRepairCost > 0 || additionalServices.length > 0) && (
                <div style={{
                  backgroundColor: darkMode ? "#2c5282" : "#e6f7ff",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "15px",
                  textAlign: "right"
                }}>


<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: darkMode ? "#fff" : "#333"
                    }}>
                      Total Repair Cost:
                    </span>
                    <span style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: darkMode ? "#fff" : "#333"
                    }}>
                      Rs. {(selectedRepair.totalRepairCost || 0).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: darkMode ? "#fff" : "#333"
                    }}>
  Final Amount:
  </span>
                    <span style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: darkMode ? "#fff" : "#333"
                    }}>
Rs. {((selectedRepair.totalRepairCost || 0) +
  (selectedRepair.additionalServices ? selectedRepair.additionalServices.reduce((total, service) => total + Math.max(0, parseFloat(service.serviceAmount || 0)), 0) : 0)
).toFixed(2)}                    </span>
                  </div>

                  {additionalServices.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: darkMode ? "#fff" : "#333"
                      }}>
                        Total Additional Services to Paid:
                      </span>
                      <span style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: darkMode ? "#fff" : "#333"
                      }}>
Rs. {additionalServices.reduce((total, service) => total + (service.isPaid ? 0 : Math.max(0, parseFloat(service.serviceAmount || 0))), 0).toFixed(2)}                      </span>
                    </div>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "10px",
                    borderTop: `2px solid ${darkMode ? "#4a5568" : "#b3e0ff"}`,
                    paddingTop: "10px"
                  }}>
<span style={{
  fontWeight: "bold",
  fontSize: "18px",
  color: darkMode ? "#63b3ed" : "#0366d6"
}}>
  AMOUNT TO PAID:
</span>
<span style={{
  fontWeight: "bold",
  fontSize: "18px",
  color: darkMode ? "#63b3ed" : "#0366d6"
}}>
  Rs. {((selectedRepair.repairStatus === "Completed")
    ? additionalServices.reduce((total, service) => total + (service.isPaid ? 0 : Math.max(0, parseFloat(service.serviceAmount || 0))), 0)
    : (selectedRepair.totalRepairCost || 0) +
      additionalServices.reduce((total, service) => total + (service.isPaid ? 0 : Math.max(0, parseFloat(service.serviceAmount || 0))), 0)
  ).toFixed(2)}
</span>
</div>
                </div>
              )}
            </div>

            <div className="modal-buttons" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              {selectedRepair.repairStatus !== "Completed" && (
                <button
                  onClick={handleCompletePayment}
                  className={`a-p-submit-btn ${darkMode ? "dark" : ""}`}
                >
                  Complete Payment
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="a-p-cancel-btn"
              >
                Close
              </button>
            </div>

            {/* Add Change History section for admin users */}
            {localStorage.getItem('role') === 'admin' && selectedRepair && selectedRepair.changeHistory && (
              <div style={{ marginTop: '20px' }}>
                {selectedRepair.isHistoryView ? (
                  // Cashier changes view
                  <div className={`change-history-container ${darkMode ? 'dark' : ''}`}>
                    <h3 className="change-history-title">Cashier Changes</h3>
                    <div className="change-history-list">
                      {Object.entries(selectedRepair.changeHistory).map(([cashier, changes]) => (
                        <div key={cashier} className="cashier-section">
                          <h4 className="cashier-name">{cashier}</h4>
                          <div className="cashier-changes">
                            {changes.map((change, index) => (
                              <div key={index} className="change-history-item">
                                <div className="change-header">
                                  <span className="change-date">{change.timestamp}</span>
                                  <span className={`change-type ${change.changeType}`}>
                                    {change.changeType.toUpperCase()}
                                  </span>
                                </div>
                                <div className="change-details">
                                  <div className="change-field">
                                    <strong>Changed:</strong> {change.field}
                                  </div>
                                  <div className="change-values">
                                    <div className="old-value">
                                      <strong>From:</strong> {typeof change.oldValue === 'object' ? JSON.stringify(change.oldValue) : change.oldValue || 'N/A'}
                                    </div>
                                    <div className="new-value">
                                      <strong>To:</strong> {typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : change.newValue || 'N/A'}
                                    </div>
                                  </div>
                                  <div className="repair-info">
                                    <strong>Repair:</strong> {change.repairInvoice} - {change.customerName}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Individual repair history
                  <ChangeHistory
                    changes={selectedRepair.changeHistory}
                    darkMode={darkMode}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <AddProductRepair
          closeModal={() => setShowAddModal(false)}
          onAddSuccess={fetchRepairs}
          darkMode={darkMode}
        />
      )}

      {showSelectModal && selectedRepair && (
        <div className="view-modal-select">
          <div className="modal-content-select">
            <div style={{ textAlign: "center", fontWeight: "bold" }}>
              SELECT PRODUCTS FOR REPAIR
            </div>
            <hr />
            <input
              type="text"
              placeholder="🔍 Search Products"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className={`product-repair-list-search-bar ${darkMode ? "dark" : ""}`}
            />
            <table className={`repair-table ${darkMode ? "dark" : ""}`}>
              <thead>
                <tr>
                  <th>ITEM CODE</th>
                  <th>ITEM NAME</th>
                  <th>STOCK</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts && filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>{product.itemCode}</td>
                    <td>{product.itemName}</td>
                    <td>{product.stock}</td>
                    <td className="action-buttons">
                      <button
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock === 0}
                        className={`select-btn ${darkMode ? "dark" : ""}`}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <br />
            <div className="selected-products-header">
              <p><strong>Selected Products:</strong></p>
              {selectedProducts.length > 0 && (
                <button
                  onClick={() => setSelectedProducts([])}
                  className="clear-all-btn"
                  title="Clear all selected products"
                >
                  Clear All
                </button>
              )}
            </div>
            {selectedProducts.length > 0 ? (
              <ul className="selected-products-list">
                {selectedProducts.map((item, index) => (
                  <li key={index} className="selected-product-item">
                    <span>{item.itemCode} - {item.itemName || "Unknown"}</span>
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="quantity-btn"
                        disabled={item.quantity <= 1}
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="quantity-btn"
                        title="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="remove-product-btn"
                        title="Remove this product"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No products selected.</p>
            )}
            <br />
            <div className="modal-buttons-container">
              <button onClick={handleUpdateCart} className="update-cart-btn">
                Update Cart
              </button>
              <button onClick={() => setShowSelectModal(false)} className="close-modal-l-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedRepair && (
        <div className="view-modal">
          <div className="modal-content">
            <div style={{ textAlign: "center", fontWeight: "bold" }}>
              RETURN PRODUCTS FROM REPAIR CART
            </div>
            <hr />
            {error && <p className="error-message">{error}</p>}
            {returnFormData.length > 0 ? (
              <form onSubmit={(e) => { e.preventDefault(); handleReturnSubmit(); }}>
                <table className={`repair-table ${darkMode ? "dark" : ""}`}>
                  <thead>
                    <tr>
                      <th>ITEM CODE</th>
                      <th>ITEM NAME</th>
                      <th>CURRENT QUANTITY</th>
                      <th>RETURN QUANTITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnFormData.map((item) => (
                      <tr key={item.itemCode}>
                        <td>{item.itemCode}</td>
                        <td>{item.itemName}</td>
                        <td>{item.maxQuantity}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => handleReturnFormChange(item.itemCode, e.target.value)}
                            className={`product-repair-list-input ${darkMode ? "dark" : ""}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <br />
                <button type="submit" className="return-submit-btn">
                  Submit Return
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="close-modal-btn"
                >
                  Close
                </button>
              </form>
            ) : (
              <p>No products available to return.</p>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedReviewRepair && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedReviewRepair.technicianReview ? "✏️ Edit Technician Review" : "➕ Add Technician Review"}</h2>
            </div>
            <div className="modal-body">
              <textarea
                id="technicianReview"
                rows="8"
                value={technicianReview}
                onChange={(e) => setTechnicianReview(e.target.value)}
                className="review-textarea"
                placeholder="Enter technician review..."
              />
              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setTechnicianReview("");
                  setSelectedReviewRepair(null);
                }}
              >
                CANCEL
              </button>
              <button
                className={selectedReviewRepair.technicianReview ? "submit" : "submit"}
                onClick={handleSubmitReview}
                disabled={loading}
              >
                {loading ? 'Saving...' : selectedReviewRepair.technicianReview ? 'UPDATE REVIEW' : 'ADD REVIEW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCashierChangesModal && (
        <div className="view-modal">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: `2px solid ${darkMode ? '#1a68bc' : '#e53e3e'}`
            }}>
              <h2 style={{
                margin: 0,
                color: darkMode ? '#1a68bc' : '#e53e3e',
                fontSize: '1.5rem'
              }}>
                Cashier Work History
              </h2>
              <button
                onClick={() => setShowCashierChangesModal(false)}
                className="close-modal-btn"
              >
                Close
              </button>
            </div>

            <div className="cashier-changes-container">
              {Object.keys(cashierChanges).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: darkMode ? '#a0aec0' : '#718096'
                }}>
                  No changes recorded yet.
                </div>
              ) : (
                Object.entries(cashierChanges).map(([cashier, changes]) => (
                  <div key={cashier} className="cashier-section">
                    <h3 className="cashier-name" style={{
                      color: darkMode ? '#63b3ed' : '#2b6cb0',
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
                    }}>
                      {cashier}
                    </h3>
                    <div className="cashier-changes">
                      {changes.map((change, index) => (
                        <div key={index} className="change-history-item" style={{
                          backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                          padding: '1rem',
                          marginBottom: '1rem',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div className="change-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem'
                          }}>
                            <span className="change-date" style={{
                              color: darkMode ? '#a0aec0' : '#718096',
                              fontSize: '0.875rem'
                            }}>
                              {change.timestamp}
                            </span>
                            <span className={`change-type ${change.changeType.toLowerCase()}`} style={{
                              backgroundColor: change.changeType === 'CREATE' ? '#48bb78' :
                                change.changeType === 'UPDATE' ? '#4299e1' : '#f56565',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {change.changeType.toUpperCase()}
                            </span>
                          </div>
                          <div className="change-details" style={{
                            color: darkMode ? '#e2e8f0' : '#2d3748'
                          }}>
                            <div className="change-field" style={{ marginBottom: '0.5rem' }}>
                              <strong>Changed:</strong> {change.field}
                            </div>
                            <div className="change-values" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1rem',
                              marginBottom: '0.5rem'
                            }}>
                              <div className="old-value">
                                <strong>From:</strong> {typeof change.oldValue === 'object' ? JSON.stringify(change.oldValue) : change.oldValue || 'N/A'}
                              </div>
                              <div className="new-value">
                                <strong>To:</strong> {typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : change.newValue || 'N/A'}
                              </div>
                            </div>
                            <div className="repair-info" style={{
                              backgroundColor: darkMode ? '#4a5568' : '#edf2f7',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              marginTop: '0.5rem'
                            }}>
                              <strong>Repair Details:</strong>
                              <div>Invoice: {change.repairInvoice}</div>
                              <div>Customer: {change.customerName}</div>
                              <div>Device: {change.deviceType}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRepairList;