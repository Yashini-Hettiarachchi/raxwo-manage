import React, { useState, useEffect } from "react";
import "./EditProduct.css";

const API_URL = "http://localhost:5002/api/products";
const SUPPLIER_API_URL = "http://localhost:5002/api/suppliers";

const EditProduct = ({ product, closeModal, darkMode }) => {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    stock: "",
    supplierName: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setFormData({
        itemName: product.itemName || "",
        category: product.category || "",
        buyingPrice: product.buyingPrice?.toString() || "",
        sellingPrice: product.sellingPrice?.toString() || "",
        stock: product.stock?.toString() || "",
        supplierName: product.supplierName || "",
      });
    }
  }, [product]);

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
      setError("Supplier Name is required");
      setLoading(false);
      return;
    }

    try {
      const changedBy = localStorage.getItem('username') || localStorage.getItem('cashierName') || 'system';
      const response = await fetch(`${API_URL}/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          buyingPrice: Number(formData.buyingPrice),
          sellingPrice: Number(formData.sellingPrice),
          stock: Number(formData.stock),
          changedBy
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      setMessage("✅ Product updated successfully!");
      setTimeout(() => closeModal(), 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`pro-edit-modal-container ${darkMode ? "dark" : ""}`}>
        <h2 className={`edp-modal-title ${darkMode ? "dark" : ""}`}>✏️ EDIT PRODUCT</h2>
        {loading && <p className="loading">Updating product...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <form className="edit-product-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>ITEM NAME</label>
              <input
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>CATEGORY</label>
              <input
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>STOCK</label>
              <input
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="right-column">
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>BUYING PRICE</label>
              <input
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="buyingPrice"
                value={formData.buyingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>SELLING PRICE</label>
              <input
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <label className={`pro-edit-label ${darkMode ? "dark" : ""}`}>SUPPLIER</label>
              <select
                className={`pro-edit-input ${darkMode ? "dark" : ""}`}
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
            <button type="submit" className="pro-edit-submit-btn" disabled={loading}>
              {loading ? "Updating..." : "UPDATE"}
            </button>
            <button type="button" className="pro-edit-cancel-btn" onClick={closeModal}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;