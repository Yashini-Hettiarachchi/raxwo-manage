import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/SalaryAdd.css";

const API_URL = "http://localhost:5002/api/salaries";
const EMPLOYEE_API_URL = "http://localhost:5002/api/salaries/employee";

const SalaryAdd = ({ isOpen, onClose, refreshSalaries, darkMode }) => {
  const [salary, setSalary] = useState({
    employeeId: "",
    employeeName: "",
    advance: "",
    remarks: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setSalary({ ...salary, [name]: value });

    if (name === "employeeId" && value) {
      try {
        const res = await axios.get(`${EMPLOYEE_API_URL}/${value}`);
        setSalary((prev) => ({ ...prev, employeeName: res.data.employeeName }));
        setError(null);
      } catch (err) {
        setSalary((prev) => ({ ...prev, employeeName: "" }));
        setError("Employee not found");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Client-side validation
    if (!salary.employeeId.trim()) {
      setError("Employee ID is required");
      setLoading(false);
      return;
    }
    if (!salary.employeeName.trim()) {
      setError("Employee not found for the provided ID");
      setLoading(false);
      return;
    }
    if (!salary.advance || Number(salary.advance) < 0) {
      setError("Advance must be a non-negative number");
      setLoading(false);
      return;
    }

    try {
      await axios.post(API_URL, {
        ...salary,
        advance: Number(salary.advance),
      });
      setMessage("✅ Salary added successfully!");
      setTimeout(() => {
        refreshSalaries();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error adding salary");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`add-salary-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`salary-modal-title ${darkMode ? "dark" : ""}`}>➕ ADD SALARY</h2>
        {loading && <p className="loading-message">Adding salary...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <form className="add-salary-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <h3 className={`as-h3 ${darkMode ? "dark" : ""}`}>EMPLOYEE DETAILS</h3>
              <label className={`add-salary-lbl ${darkMode ? "dark" : ""}`}>Employee ID</label>
              <input
                className={`add-salary-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="employeeId"
                value={salary.employeeId}
                onChange={handleChange}
                required
              />
              <label className={`add-salary-lbl ${darkMode ? "dark" : ""}`}>Employee Name</label>
              <input
                className={`add-salary-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="employeeName"
                value={salary.employeeName}
                readOnly
              />
            </div>
            <div className="right-column">
              <h3 className={`as-h3 ${darkMode ? "dark" : ""}`}>SALARY DETAILS</h3>
              <label className={`add-salary-lbl ${darkMode ? "dark" : ""}`}>Advance (LKR)</label>
              <input
                className={`add-salary-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="advance"
                value={salary.advance}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <label className={`add-salary-lbl ${darkMode ? "dark" : ""}`}>Remarks</label>
              <input
                className={`add-salary-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="remarks"
                value={salary.remarks}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="a-s-submit-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Salary"}
            </button>
            <button type="button" className="a-s-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryAdd;