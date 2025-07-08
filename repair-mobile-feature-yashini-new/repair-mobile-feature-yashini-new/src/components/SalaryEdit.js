import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/SalaryEdit.css";

const API_URL = "http://localhost:5002/api/salaries";
const EMPLOYEE_API_URL = "http://localhost:5002/api/salaries/employee";

const SalaryEdit = ({ isOpen, onClose, salary, refreshSalaries, darkMode }) => {
  const [formData, setFormData] = useState({
    employeeId: salary.employeeId,
    employeeName: salary.employeeName,
    advance: salary.advance,
    remarks: salary.remarks,
  });
  const [error, setError] = useState(null);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "employeeId" && value) {
      try {
        const res = await axios.get(`${EMPLOYEE_API_URL}/${value}`);
        setFormData((prev) => ({ ...prev, employeeName: res.data.employeeName }));
        setError(null);
      } catch (err) {
        setFormData((prev) => ({ ...prev, employeeName: "" }));
        setError("Employee not found");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${salary._id}`, formData);
      alert("Salary updated successfully");
      refreshSalaries();
      onClose();
    } catch (err) {
      alert("Error updating salary: " + err.response?.data?.message || err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`salary-add-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`modal-title ${darkMode ? "dark" : ""}`}>Edit Salary</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="add-salary-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <label className={`salary-add-label ${darkMode ? "dark" : ""}`}>Employee ID</label>
              <input
                className={`salary-add-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
              <label className={`salary-add-label ${darkMode ? "dark" : ""}`}>Employee Name</label>
              <input
                className={`salary-add-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="employeeName"
                value={formData.employeeName}
                readOnly
              />
            </div>
            <div className="right-column">
              <label className={`salary-add-label ${darkMode ? "dark" : ""}`}>Advance (LKR)</label>
              <input
                className={`salary-add-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                required
                min="0"
              />
              <label className={`salary-add-label ${darkMode ? "dark" : ""}`}>Remarks</label>
              <input
                className={`salary-add-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="salary-add-submit-btn">Update</button>
            <button type="button" className="salary-add-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryEdit;