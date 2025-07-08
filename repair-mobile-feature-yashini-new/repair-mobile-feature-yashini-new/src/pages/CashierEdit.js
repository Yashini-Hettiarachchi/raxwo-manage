import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/CashierEdit.css"; // Create and use a new CSS file for CashierEdit

const API_URL = "http://localhost:5002/api/cashiers";

const CashierEdit = ({ isOpen, onClose, cashier, refreshCashiers, darkMode }) => {
  const [updatedCashier, setUpdatedCashier] = useState(cashier);

  useEffect(() => {
    setUpdatedCashier(cashier);
  }, [cashier]);

  const handleChange = (e) => {
    setUpdatedCashier({ ...updatedCashier, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${updatedCashier._id}`, updatedCashier);
      alert("Cashier updated successfully");
      refreshCashiers();
      onClose();
    } catch (err) {
      alert("Error updating cashier");
    }
  };

  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <div className="ca-edit-modal-overlay" onClick={onClose}>
      <div className={`cashier-edit-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Cashier Or Employee</h2>
        <form className="edit-cashier-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
           
              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Id</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="id" value={updatedCashier.id} onChange={handleChange} required />
              
          
              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Name</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="cashierName" value={updatedCashier.cashierName} onChange={handleChange} required />


              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Phone</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="phone" value={updatedCashier.phone} onChange={handleChange} required />


              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Nic</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="nic" value={updatedCashier.nic} onChange={handleChange} required />
                 
            </div>
            <div className="right-column">

              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Email</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="email" name="email" value={updatedCashier.email} onChange={handleChange} required />


              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Job Role</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="jobRole" value={updatedCashier.jobRole} onChange={handleChange} required />

              <label className={`ce-input-group-label ${darkMode ? "dark" : ""}`}>Remarks</label>
              <input className={`ce-input-group-input ${darkMode ? "dark" : ""}`} type="text" name="remarks" value={updatedCashier.remarks} onChange={handleChange} />
             
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="cashier-edit-submit-btn">Update</button>
            <button type="button" className="cashier-edit-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashierEdit;