import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

import "../styles/CashierAdd.css";

const API_URL = "http://localhost:5002/api/cashiers";

const CashierAdd = ({ isOpen, onClose, refreshCashiers, darkMode }) => {
  const [cashier, setCashier] = useState({
    cashierName: "",
    phone: "",
    nic: "",
    email: "",
    id: "",
    jobRole: "Cashier", // Default value
    remarks: "",
  });

  const handleChange = (e) => {
    setCashier({ ...cashier, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, cashier);
      alert("Cashier added successfully");
      refreshCashiers();
      onClose();
    } catch (err) {
      alert("Error adding cashier");
    }
  };

  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <div className="ca-add-modal-overlay" onClick={onClose}>
      <div className={`cashier-add-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">          <FontAwesomeIcon icon={faPlus} />Add Cashier or Employee</h2>
        <form className="add-cashier-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
           
              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Id</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="text" name="id" value={cashier.id} onChange={handleChange} required />
             
             
              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Name</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="text" name="cashierName" value={cashier.cashierName} onChange={handleChange} required />
              
              
              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Phone</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="text" name="phone" value={cashier.phone} onChange={handleChange} required />


              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Nic</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="text" name="nic" value={cashier.nic} onChange={handleChange} required />
             
            </div>
            <div className="right-column">
            
              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Email</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="email" name="email" value={cashier.email} onChange={handleChange} required />
              
             
              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Job Role</label>
              <select name="jobRole" value={cashier.jobRole} onChange={handleChange} required>
                <option value="Cashier">Cashier</option>
                <option value="Employee">Employee</option>
              </select>


              <label className={`cash-add-lable ${darkMode ? "dark" : ""}`}>Remarks</label>
              <input className={`cash-add-input ${darkMode ? "dark" : ""}`} type="text" name="remarks" value={cashier.remarks} onChange={handleChange} />
              
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="a-p-submit-btn">Add</button>
            <button type="button" className="a-p-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashierAdd;