import React, { useState, useEffect } from "react";
import "../styles/SupplierAdd.css";

const API_URL = "http://localhost:5002/api/suppliers";

const AddSupplier = ({ supplier, closeModal, darkMode, refreshSuppliers }) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    businessName: "",
    supplierName: "",
    phoneNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [amountDue, setAmountDue] = useState(0);

  // Function to get current date & time
  const getCurrentDateTime = () => {
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTime = now.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS
    return { date: formattedDate, time: formattedTime };
  };

  // Auto-fill date & time, populate form for editing, and calculate payment details
  useEffect(() => {
    if (supplier) {
      setFormData({
        date: supplier.date || getCurrentDateTime().date,
        time: supplier.time || getCurrentDateTime().time,
        businessName: supplier.businessName || "",
        supplierName: supplier.supplierName || "",
        phoneNumber: supplier.phoneNumber || "",
        address: supplier.address || "",
      });
      // Calculate payment details
      const cost = supplier.items.reduce(
        (sum, item) => sum + (item.buyingPrice || 0) * (item.quantity || 0),
        0
      );
      const payments = supplier.totalPayments || 0;
      setTotalCost(cost);
      setTotalPayments(payments);
      setAmountDue(cost - payments);
    } else {
      const { date, time } = getCurrentDateTime();
      setFormData((prev) => ({ ...prev, date, time }));
      setTotalCost(0);
      setTotalPayments(0);
      setAmountDue(0);
    }
    setError("");
    setSuccess("");
  }, [supplier]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate supplierName
    if (!formData.supplierName.trim()) {
      setError("Supplier Name is required");
      setLoading(false);
      return;
    }

    // Validate phoneNumber format (optional, but if provided, should be valid)
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      setError("Phone Number must be a 10-digit number");
      setLoading(false);
      return;
    }

    try {
      const changedBy = localStorage.getItem('username') || localStorage.getItem('cashierName') || 'system';
      const url = supplier ? `${API_URL}/${supplier._id}` : API_URL;
      const method = supplier ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, changedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${supplier ? 'update' : 'add'} supplier`);
      }

      setSuccess(`✅ Supplier ${supplier ? 'updated' : 'added'} successfully!`);
      if (refreshSuppliers) {
        await refreshSuppliers();
      }
      setTimeout(() => closeModal(), 1500);
    } catch (error) {
      setError(error.message);
      console.error(`Error ${supplier ? 'updating' : 'adding'} supplier:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`add-supplier-container ${darkMode ? "dark" : ""}`}>
        <h2 className={`sup-modal-title ${darkMode ? "dark" : ""}`}>
          {supplier ? '✏️ EDIT SUPPLIER' : '➕ ADD SUPPLIER'}
        </h2>
        {loading && <p className="loading">Processing...</p>}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <form className="add-supplier-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <h3 className={`as-h3 ${darkMode ? "dark" : ""}`}>SUPPLIER DETAILS</h3>
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Date</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="date"
                value={formData.date}
                readOnly
              />
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Time</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="time"
                value={formData.time}
                readOnly
              />
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Supplier Name *</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="right-column">
              <h3 className={`as-h3 ${darkMode ? "dark" : ""}`}>
                {supplier ? 'PAYMENT DETAILS' : 'CONTACT DETAILS'}
              </h3>
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Business Name</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Phone Number</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g., 1234567890"
              />
              <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Address</label>
              <input
                className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              {supplier && (
                <>
                  <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Total Cost</label>
                  <input
                    className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                    type="text"
                    value={`Rs. ${totalCost.toFixed(2)}`}
                    readOnly
                  />
                  <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Total Payments Made</label>
                  <input
                    className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                    type="text"
                    value={`Rs. ${totalPayments.toFixed(2)}`}
                    readOnly
                  />
                  <label className={`add-supplier-lbl ${darkMode ? "dark" : ""}`}>Amount Due</label>
                  <input
                    className={`add-supplier-input ${darkMode ? "dark" : ""}`}
                    type="text"
                    value={`Rs. ${amountDue.toFixed(2)}`}
                    readOnly
                  />
                </>
              )}
            </div>
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="a-s-submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : supplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
            <button
              type="button"
              className="a-s-cancel-btn"
              onClick={closeModal}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplier;