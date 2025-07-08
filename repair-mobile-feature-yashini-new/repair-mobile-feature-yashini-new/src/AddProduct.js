import React, { useState, useEffect } from "react";
import "./AddProduct.css";

const API_URL = "http://localhost:5002/api/products";
const SUPPLIER_API_URL = "http://localhost:5002/api/suppliers";

const AddProduct = ({ closeModal, darkMode }) => {
  const [formData, setFormData] = useState({
    itemCode: Date.now().toString(), // TEMP: auto-generate unique itemCode
    itemName: "",
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    stock: "",
    supplierName: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingItemCode, setCheckingItemCode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(SUPPLIER_API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }
        const data = await response.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!formData.itemName.trim()) {
      setError("Item Name is required");
      setLoading(false);
      return;
    }
    if (!formData.category.trim()) {
      setError("Category is required");
      setLoading(false);
      return;
    }
    if (!formData.stock || Number(formData.stock) < 0) {
      setError("Stock must be a non-negative number");
      setLoading(false);
      return;
    }
    if (!formData.buyingPrice || Number(formData.buyingPrice) < 0) {
      setError("Buying Price must be a non-negative number");
      setLoading(false);
      return;
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) < 0) {
      setError("Selling Price must be a non-negative number");
      setLoading(false);
      return;
    }
    if (!formData.supplierName.trim()) {
      setError("Supplier is required");
      setLoading(false);
      return;
    }

    // Ensure itemCode is always set (regenerate if needed)
    const payload = {
      ...formData,
      itemCode: formData.itemCode || Date.now().toString(),
      buyingPrice: Number(formData.buyingPrice),
      sellingPrice: Number(formData.sellingPrice),
      stock: Number(formData.stock),
    };

    try {
      const changedBy = localStorage.getItem('username') || localStorage.getItem('cashierName') || 'system';
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, changedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product");
      }

      setMessage("✅ Product added successfully!");
      setTimeout(() => closeModal(), 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`add-product-container ${darkMode ? "dark" : ""}`}>
        <h2 className={`produ-modal-title ${darkMode ? "dark" : ""}`}>➕ ADD PRODUCT</h2>
        {loading && <p className="loading">Adding product...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <form className="add-product-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <h3 className={`ap-h3 ${darkMode ? "dark" : ""}`}>ITEM DETAILS</h3>
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Item Name</label>
              <input
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Category</label>
              <input
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Stock</label>
              <input
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="right-column">
              <h3 className={`ap-h3 ${darkMode ? "dark" : ""}`}>PRICES</h3>
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Buying Price</label>
              <input
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="buyingPrice"
                value={formData.buyingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Selling Price</label>
              <input
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <label className={`add-product-lbl ${darkMode ? "dark" : ""}`}>Supplier</label>
              <select
                className={`add-product-input ${darkMode ? "dark" : ""}`}
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier.supplierName}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="a-p-submit-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Product"}
            </button>
            <button type="button" className="a-p-cancel-btn" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;