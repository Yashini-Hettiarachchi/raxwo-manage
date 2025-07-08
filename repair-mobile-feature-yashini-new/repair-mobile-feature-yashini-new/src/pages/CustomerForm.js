import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/CustomerForm.css";

const CustomerForm = ({ totalAmount, paymentType, onClose, darkMode, onSubmit }) => {
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState({
    nic: "",
    customerName: "",
    mobile: "",
    address: "",
    totalAmount,
    paymentType,
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      navigate("/");
      return;
    }

    try {
      await axios.post("http://localhost:5002/api/customers", customerData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Store customer details temporarily for wholesale bill
      localStorage.setItem("wholesaleCustomer", JSON.stringify({
        nic: customerData.nic,
        customerName: customerData.customerName,
        mobile: customerData.mobile,
      }));
      alert("Customer details saved successfully!");
      // Pass isWholesale flag and customer details to parent
      onSubmit({
        isWholesale: true,
        customerDetails: {
          nic: customerData.nic,
          customerName: customerData.customerName,
          mobile: customerData.mobile,
        },
      });
      onClose();
    } catch (error) {
      console.error("Error saving customer details:", error.response?.data);
      if (error.response?.status === 401) {
        alert("Session expired or invalid token. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        navigate("/");
      } else {
        setError(error.response?.data?.message || "Error saving customer details.");
      }
    }
  };

  return (
    <div className="customer-form-overlay">
      <div className={`customer-form ${darkMode ? "dark" : ""}`}>
        <h2 className={`cusform-title ${darkMode ? "dark" : ""}`}>{paymentType} Customer Details</h2>
        {error && <p className={`error-message ${darkMode ? "dark" : ""}`}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label className={`cus-label ${darkMode ? "dark" : ""}`}>NIC:</label>
          <input
            type="text"
            name="nic"
            value={customerData.nic}
            onChange={handleChange}
            required
          />

          <label className={`cus-label ${darkMode ? "dark" : ""}`}>Customer Name:</label>
          <input
            type="text"
            name="customerName"
            value={customerData.customerName}
            onChange={handleChange}
            required
          />

          <label className={`cus-label ${darkMode ? "dark" : ""}`}>Mobile:</label>
          <input
            type="text"
            name="mobile"
            value={customerData.mobile}
            onChange={handleChange}
            required
          />

          <label className={`cus-label ${darkMode ? "dark" : ""}`}>Address:</label>
          <input
            type="text"
            name="address"
            value={customerData.address}
            onChange={handleChange}
            required
          />

          <h3 className={`cusform-tot ${darkMode ? "dark" : ""}`}>
            Total: ${totalAmount.toFixed(2)}
          </h3>

          <div className="button-group">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;