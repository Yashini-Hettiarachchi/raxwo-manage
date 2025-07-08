import React, { useState, useEffect } from "react";
import "../styles/SupplierAdd.css";

const API_URL = "http://localhost:5002/api/suppliers";

const SupplierUpdate = ({ isOpen, onClose, supplierId, refreshSuppliers, darkMode }) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    businessName: "",
    supplierName: "",
    phoneNumber: "",
    address: "",
  });
  const [error, setError] = useState("");

  // Function to get current date & time
  const getCurrentDateTime = () => {
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTime = now.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS
    return { date: formattedDate, time: formattedTime };
  };

  // Fetch supplier data and auto-fill date & time
  useEffect(() => {
    if (supplierId) {
      fetch(`${API_URL}/${supplierId}`)
        .then((response) => response.json())
        .then((data) =>
          setFormData({
            date: data.date || getCurrentDateTime().date,
            time: data.time || getCurrentDateTime().time,
            businessName: data.businessName || "",
            supplierName: data.supplierName || "",
            phoneNumber: data.phoneNumber || "",
            address: data.address || "",
          })
        )
        .catch((error) => {
          console.error("Error fetching supplier:", error);
          setError("Failed to fetch supplier data");
        });
    }
  }, [supplierId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/${supplierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update supplier");
      }

      refreshSuppliers();
      onClose();
    } catch (error) {
      setError(error.message);
      console.error("Error updating supplier:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${darkMode ? "dark" : ""}`}>
      <div className={`sup-add-modal-container ${darkMode ? "dark" : ""}`}>
        <h2 className="modal-title">Update Supplier</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="supplier-form" onSubmit={handleSubmit}>
          <div className="left-column">
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>DATE</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="date"
              value={formData.date}
              readOnly
            />
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>TIME</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="time"
              value={formData.time}
              readOnly
            />
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>SUPPLIER NAME *</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="right-column">
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>BUSINESS NAME</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
            />
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>PHONE NUMBER</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <label className={`sup-add-lable ${darkMode ? "dark" : ""}`}>ADDRESS</label>
            <input
              className={`sup-add-input ${darkMode ? "dark" : ""}`}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="button-group">
            <button type="submit" className={`sup-add-submit-btn ${darkMode ? "dark" : ""}`}>
              Update Supplier
            </button>
            <button
              type="button"
              className={`sup-add-cancel-btn ${darkMode ? "dark" : ""}`}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierUpdate;