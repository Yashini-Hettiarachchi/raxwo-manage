import React, { useState, useEffect } from 'react';
import '../styles/ReturnDetailsModal.css';

const API_URL = 'http://localhost:5002/api/return';

const ReturnDetailsModal = ({ closeModal }) => {
  const [returnRecords, setReturnRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReturnRecords = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Check if data is valid
        if (Array.isArray(data) && data.length > 0) {
          setReturnRecords(data);
        } else {
          setReturnRecords([]);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch return details');
        setLoading(false);
      }
    };

    fetchReturnRecords();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Return Details</h3>

        {loading ? (
          <p>Loading return records...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : returnRecords.length === 0 ? (
          <p>No return records available.</p>
        ) : (
          <table className="return-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Return Quantity</th>
                <th>Return Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {returnRecords.map((record) => (
                <tr key={record._id}>
                  <td>{record.itemCode || 'N/A'}</td>
                  <td>{record.itemName || 'Unknown'}</td>
                  <td>{record.returnQuantity}</td>
                  <td className={record.returnType === 'in-stock' ? 'in-stock' : 'out-stock'}>
                    {record.returnType === 'in-stock' ? 'Returned to Stock' : 'Returned Out of Stock'}
                  </td>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button onClick={closeModal} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default ReturnDetailsModal;
