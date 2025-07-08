import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./AddProductRepair.css";

const API_URL = "http://localhost:5002/api/productsRepair";

const EditProductRepair = ({ repair, closeModal, darkMode }) => {
  const [formData, setFormData] = useState({
    // Customer Details
    customerType: repair.customerType || "New Customer",
    customerName: repair.customerName || "",
    customerPhone: repair.customerPhone || "",
    customerEmail: repair.customerEmail || "",
    customerNIC: repair.customerNIC || "",
    customerAddress: repair.customerAddress || "",
    // Job Details
    repairInvoice: repair.repairInvoice || "",
    deviceType: repair.deviceType || "",
    serialNumber: repair.serialNumber || "",
    estimationValue: repair.estimationValue || "",
    checkingCharge: repair.checkingCharge || "",
    issueDescription: repair.issueDescription || "",
    additionalNotes: repair.additionalNotes || "",
    repairCost: repair.repairCost || "",
    repairStatus: repair.repairStatus || "Pending",
    // Additional fields
    repairCart: repair.repairCart || [],
    totalRepairCost: repair.totalRepairCost || 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deviceIssues, setDeviceIssues] = useState([]);
  const [newIssue, setNewIssue] = useState("");
  const [showNewIssueInput, setShowNewIssueInput] = useState(false);

  useEffect(() => {
    if (repair && repair._id) {
      console.log("Repair prop received:", repair);

      const newFormData = {
        // Customer Details
        customerType: repair.customerType || "New Customer",
        customerName: repair.customerName || "",
        customerPhone: repair.customerPhone || "",
        customerEmail: repair.customerEmail || "",
        customerNIC: repair.customerNIC || "",
        customerAddress: repair.customerAddress || "",
        // Job Details
        repairInvoice: repair.repairInvoice || "",
        deviceType: repair.deviceType || repair.itemName || "",
        serialNumber: repair.serialNumber || "",
        estimationValue: repair.estimationValue !== undefined ? repair.estimationValue : "",
        checkingCharge: repair.checkingCharge !== undefined ? repair.checkingCharge : "",
        issueDescription: repair.issueDescription || "",
        additionalNotes: repair.additionalNotes || "",
        repairCost: repair.repairCost !== undefined ? repair.repairCost : "",
        repairStatus: repair.repairStatus || "Pending",
        repairCart: repair.repairCart || [],
        totalRepairCost: repair.totalRepairCost !== undefined ? repair.totalRepairCost : 0,
      };

      console.log("Repair cart from backend:", repair.repairCart);
      console.log("Total repair cost from backend:", repair.totalRepairCost);
      console.log("Form data initialized:", newFormData);
      setFormData(newFormData);
    } else {
      setError("No valid repair record provided.");
      console.error("Invalid repair prop:", repair);
    }
  }, [repair]);

  // Fetch device issues when component mounts
  useEffect(() => {
    const fetchDeviceIssues = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/deviceIssues');
        if (response.ok) {
          const data = await response.json();
          setDeviceIssues(data);
        }
      } catch (err) {
        console.error('Error fetching device issues:', err);
      }
    };
    fetchDeviceIssues();
  }, []);

  const handleAddNewIssue = async () => {
    if (!newIssue.trim()) return;

    try {
      const response = await fetch('http://localhost:5002/api/deviceIssues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issue: newIssue.trim() }),
      });

      if (response.ok) {
        const addedIssue = await response.json();
        setDeviceIssues([...deviceIssues, addedIssue]);
        setFormData({ ...formData, issueDescription: addedIssue.issue });
        setNewIssue("");
        setShowNewIssueInput(false);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to add new issue');
      }
    } catch (err) {
      setError('Error adding new issue');
      console.error('Error adding new issue:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name !== "repairInvoice") {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        console.log("Form data updated:", updatedData);
        return updatedData;
      });
    }
  };

  const generateJobBill = (invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("EXXPLAN Repair Services", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("123 Repair Lane, Tech City, TC 45678", 105, 28, { align: "center" });
    doc.text("Phone: (555) 123-4567 | Email: support@exxplan.com", 105, 34, { align: "center" });

    doc.setFontSize(16);
    doc.text("Job Bill", 20, 50);
    doc.setFontSize(12);
    doc.text(`Job Number: ${invoice}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 60);

    doc.autoTable({
      startY: 70,
      head: [["Description", "Details"]],
      body: [
        // Customer Details
        ["Customer Type", formData.customerType],
        ["Customer Name", formData.customerName],
        ["Customer Phone", formData.customerPhone],
        ["Customer Email", formData.customerEmail || "N/A"],
        ["Customer NIC", formData.customerNIC || "N/A"],
        ["Customer Address", formData.customerAddress || "N/A"],
        // Job Details
        ["Job Number", invoice],
        ["Device Type", formData.deviceType],
        ["Serial Number", formData.serialNumber || "N/A"],
        ["Estimation Value", `Rs. ${formData.estimationValue || "0.00"}`],
        ["Checking Charge", `Rs. ${formData.checkingCharge || "0.00"}`],
        ["Issue Description", formData.issueDescription],
        ["Additional Notes", formData.additionalNotes || "N/A"],
        ["Repair Status", formData.repairStatus],
      ],
      styles: { fontSize: 12, cellPadding: 3 },
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 20, right: 20 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Checking Charge: Rs. ${parseFloat(formData.checkingCharge || 0).toFixed(2)}`, 150, finalY);

    doc.setFontSize(10);
    doc.setLineWidth(0.5);
    doc.line(20, finalY + 20, 190, finalY + 20);
    doc.text("Thank you for choosing EXXPLAN Repair Services!", 105, finalY + 30, { align: "center" });
    doc.text("Terms: Payment due within 30 days. Contact us for support.", 105, finalY + 36, { align: "center" });

    doc.save(`JobBill_${invoice}_${Date.now()}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repair || !repair._id) {
      setError("Cannot update: No valid repair ID provided.");
      console.error("Missing repair ID:", repair);
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    // Calculate cart total
    const cartTotal = (formData.repairCart || []).reduce((total, item) => total + item.cost, 0);

    // Get the current user's name from localStorage
    const changedBy = localStorage.getItem('username') || 'System';

    const requestBody = {
      ...formData,
      customerEmail: formData.customerEmail || "N/A",
      customerNIC: formData.customerNIC || "N/A",
      customerAddress: formData.customerAddress || "N/A",
      itemName: formData.deviceType, // Use deviceType as itemName to satisfy backend schema
      serialNumber: formData.serialNumber || "N/A",
      estimationValue: formData.estimationValue ? parseFloat(formData.estimationValue) : 0,
      checkingCharge: formData.checkingCharge ? parseFloat(formData.checkingCharge) : 0,
      additionalNotes: formData.additionalNotes || "N/A",
      repairCost: parseFloat(formData.repairCost) || 0,
      repairCart: formData.repairCart || [],
      totalRepairCost: formData.totalRepairCost || cartTotal + (parseFloat(formData.repairCost) || 0),
      changedBy // Add changedBy to the request body
    };
    console.log("Submitting request with body:", requestBody);

    try {
      console.log("Sending PATCH request...");
      let response = await fetch(`${API_URL}/${repair._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      let responseData = await response.json();
      console.log("PATCH response:", response.status, responseData);

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          console.log("PATCH failed, sending PUT request...");
          response = await fetch(`${API_URL}/${repair._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          responseData = await response.json();
          console.log("PUT response:", response.status, responseData);

          if (!response.ok) {
            throw new Error(responseData.message || "Failed to update repair record with PUT");
          }
        } else {
          throw new Error(responseData.message || "Failed to update repair record with PATCH");
        }
      }

      console.log("Update successful, server returned:", responseData);
      if (responseData) {
        setFormData({
          ...formData,
          repairCart: responseData.repairCart || formData.repairCart || [],
          totalRepairCost: responseData.totalRepairCost !== undefined ? responseData.totalRepairCost : formData.totalRepairCost,
        });
      }

      setMessage("✅ Repair record updated successfully!");
      generateJobBill(formData.repairInvoice);
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repair-modal-overlay">
      <div className={`repair-container ${darkMode ? "dark" : ""}`}>
        <div className="repair-header" style={{ position: "sticky", top: 0, backgroundColor: darkMode ? "#0F172A" : "whitesmoke", zIndex: 10, paddingTop: "10px", paddingBottom: "10px", borderBottom: `1px solid ${darkMode ? "#4a5568" : "#ddd"}` }}>
          <h2 className="repair-title">✏️ EDIT REPAIR RECORD</h2>

          {loading && <p className="loading">Updating repair record...</p>}
          {error && <p className="repair-error-message">{error}</p>}
          {message && <p className="repair-success-message">{message}</p>}
        </div>

        <form className="repair-form" onSubmit={handleSubmit}>
          <div className="repair-form-row">
            {/* Column 1: Customer Details */}
            <div className="repair-column">
              <h3 className="repair-section-header">CUSTOMER DETAILS</h3>

              <label className="repair-label">CUSTOMER TYPE</label>
              <select
                className="repair-input"
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                required
              >
                <option value="New Customer">New Customer</option>
                <option value="Existing Customer">Existing Customer</option>
                <option value="Corporate">Corporate</option>
                <option value="VIP">VIP</option>
              </select>

              <label className="repair-label">CUSTOMER NAME</label>
              <input
                className="repair-input"
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                placeholder="Enter customer name"
              />

              <label className="repair-label">MOBILE NUMBER</label>
              <input
                className="repair-input"
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                placeholder="Enter mobile number"
              />

              <label className="repair-label">EMAIL ADDRESS</label>
              <input
                className="repair-input"
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="Enter email address (optional)"
              />
            </div>

            {/* Column 2: Device Details */}
            <div className="repair-column">
              <h3 className="repair-section-header">DEVICE DETAILS</h3>

              <label className="repair-label">JOB NUMBER</label>
              <input
                className="repair-input"
                type="text"
                name="repairInvoice"
                value={formData.repairInvoice}
                readOnly
              />

              <label className="repair-label">DEVICE</label>
              <input
                className="repair-input"
                type="text"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                required
                placeholder="Enter device type"
              />

              <label className="repair-label">SERIAL NUMBER</label>
              <input
                className="repair-input"
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="Enter serial number (optional)"
              />

              <label className="repair-label">DEVICE ISSUE</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="repair-input"
                  name="issueDescription"
                  value={formData.issueDescription}
                  onChange={(e) => {
                    if (e.target.value === "add_new") {
                      setShowNewIssueInput(true);
                    } else {
                      setFormData({ ...formData, issueDescription: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">Select an issue</option>
                  {deviceIssues.map((issue) => (
                    <option key={issue._id} value={issue.issue}>
                      {issue.issue}
                    </option>
                  ))}
                  <option value="add_new">+ Add New Issue</option>
                </select>

                {showNewIssueInput && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: darkMode ? '#444' : '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    <input
                      className="repair-input"
                      type="text"
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="Enter new issue"
                      style={{ marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleAddNewIssue}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                        }}
                        type="button"
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#059669';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#10b981';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNewIssueInput(false);
                          setNewIssue("");
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                        }}
                        type="button"
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#dc2626';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#ef4444';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Repair Details */}
            <div className="repair-column">
              <h3 className="repair-section-header">REPAIR DETAILS</h3>

              <label className="repair-label">ESTIMATION VALUE</label>
              <input
                className="repair-input"
                type="number"
                name="estimationValue"
                value={formData.estimationValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter estimated value (optional)"
              />

              <label className="repair-label">CHECKING CHARGE</label>
              <input
                className="repair-input"
                type="number"
                name="checkingCharge"
                value={formData.checkingCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter checking charge (optional)"
              />

              {/* Display total repair cost if available */}
              <div className="repair-total-cost">
                <label className="repair-label">TOTAL REPAIR COST</label>
                <div className="repair-total-cost-value">
                  Rs. {formData.totalRepairCost || (formData.repairCart || []).reduce((total, item) => total + item.cost, 0)}
                </div>
              </div>

              <label className="repair-label">REPAIR STATUS</label>
              <select
                className="repair-input"
                name="repairStatus"
                value={formData.repairStatus}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <label className="repair-label">ADDITIONAL NOTES</label>
              <textarea
                className="repair-textarea"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Enter any additional notes (optional)"
                rows="3"
              />

              {/* Always display repair cart section, even if empty */}
              <div className="repair-cart-section">
                <h4 className="repair-cart-header">REPAIR ITEMS</h4>
                <div className="repair-cart-items">
                  {formData.repairCart && formData.repairCart.length > 0 ? (
                    <table className="repair-cart-table">
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Item Name</th>
                          <th>Quantity</th>
                          <th>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.repairCart.map((item, index) => (
                          <tr key={index}>
                            <td>{item.itemCode}</td>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="repair-cart-total-label">Total Cart Cost:</td>
                          <td className="repair-cart-total-value">
                            Rs. {formData.repairCart.reduce((total, item) => total + item.cost, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <p className="no-items-message">No job items added yet. Use the "Select" button in the main job list to add items.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="repair-button-group">
            <button type="submit" className="repair-submit-btn" disabled={loading}>
              {loading ? "Updating..." : "UPDATE REPAIR"}
            </button>
            <button
              type="button"
              className="repair-download-btn"
              onClick={() => generateJobBill(formData.repairInvoice)}
              disabled={!formData.repairInvoice}
            >
              DOWNLOAD JOB BILL
            </button>
            <button type="button" className="repair-cancel-btn" onClick={closeModal}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductRepair;