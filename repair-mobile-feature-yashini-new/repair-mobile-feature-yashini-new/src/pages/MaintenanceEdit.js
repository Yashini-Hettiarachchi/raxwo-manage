import React, { useState, useEffect } from "react";
import '../styles/MaintenanceEdit.css';

const API_URL = "http://localhost:5002/api/maintenance";

const MaintenanceEdit = ({ record, onClose, onUpdate, darkMode }) => {
  const [editedRecord, setEditedRecord] = useState({ ...record });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!editedRecord.date) {
      const currentDate = new Date().toISOString().split("T")[0];
      setEditedRecord((prevRecord) => ({ ...prevRecord, date: currentDate }));
    }
    if (!editedRecord.time) {
      const currentTime = new Date().toLocaleTimeString();
      setEditedRecord((prevRecord) => ({ ...prevRecord, time: currentTime }));
    }
  }, [editedRecord]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/${editedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedRecord),
      });
      if (!response.ok) throw new Error("Error updating maintenance record");
      onUpdate();
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="m-e-modal-overlay" onClick={onClose}>
      <div className={`m-e-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={`m-e-title ${darkMode ? "dark" : ""}`} >Edit Maintenance Record</h3>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleUpdate}>
          <label className={`me-lable ${darkMode ? "dark" : ""}`}>Date</label>
          <input
            type="text"
            className={`me-input ${darkMode ? "dark" : ""}`}
            value={editedRecord.date}
            onChange={(e) => setEditedRecord({ ...editedRecord, date: e.target.value })}
            required
          />
          <label className={`me-lable ${darkMode ? "dark" : ""}`}>Time</label>
          <input
            type="text"
            className={`me-input ${darkMode ? "dark" : ""}`}
            value={editedRecord.time}
            onChange={(e) => setEditedRecord({ ...editedRecord, time: e.target.value })}
            required
          />
          <label className={`me-lable ${darkMode ? "dark" : ""}`}>Service Type</label>
          <input
            type="text"
            className={`me-input ${darkMode ? "dark" : ""}`}
            value={editedRecord.serviceType}
            onChange={(e) => setEditedRecord({ ...editedRecord, serviceType: e.target.value })}
            required
          />
          <label className={`me-lable ${darkMode ? "dark" : ""}`}>Price</label>
          <input
            type="number"
            className={`me-input ${darkMode ? "dark" : ""}`}
            value={editedRecord.price}
            onChange={(e) => setEditedRecord({ ...editedRecord, price: e.target.value })}
            required
          />
          <label className={`me-lable ${darkMode ? "dark" : ""}`}>Remarks</label>
          <input
            type="text"
            className={`me-input ${darkMode ? "dark" : ""}`}
            value={editedRecord.remarks}
            onChange={(e) => setEditedRecord({ ...editedRecord, remarks: e.target.value })}
          />
          <div className="button-group">
            <button type="submit" className="m-e-update">Update</button>
            <button type="button" onClick={onClose} className="m-e-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceEdit;