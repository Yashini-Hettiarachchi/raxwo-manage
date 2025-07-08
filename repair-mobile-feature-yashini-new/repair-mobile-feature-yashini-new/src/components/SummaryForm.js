////////supplier////////

import React, { useState } from 'react';
import '../styles/Supplier.css';

const SummaryForm = ({ suppliers, closeModal, darkMode }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Calculate summary details for the selected supplier
  const selectedSupplier = suppliers.find((supplier) => supplier._id === selectedSupplierId);
  let totalQuantity = 0;
  let totalCost = 0;
  let totalPayments = 0;
  let amountDue = 0;

  if (selectedSupplier) {
    totalQuantity = selectedSupplier.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    totalCost = selectedSupplier.items.reduce(
      (sum, item) => sum + (item.buyingPrice || 0) * (item.quantity || 0),
      0
    );
    totalPayments = selectedSupplier.totalPayments || 0;
    amountDue = totalCost - totalPayments;
  }

  return (
    <div className="summary-modal-overlay" onClick={closeModal}>
      <div className={`summary-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <h3 className="summary-modal-title">Supplier Summary</h3>
          <button className="summary-modal-close-icon" onClick={closeModal}>
            ✕
          </button>
        </div>
        <form className="summary-form">
          <div>
            <label className="summary-label">Select Supplier</label>
            <select
              className="summary-select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">-- Select a Supplier --</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </div>
          {selectedSupplier && (
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supplier Name</td>
                  <td>{selectedSupplier.supplierName || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Total Quantity Purchased</td>
                  <td>{totalQuantity}</td>
                </tr>
                <tr>
                  <td>Total Cost</td>
                  <td>Rs. {totalCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Payments Made</td>
                  <td>Rs. {totalPayments.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Amount Due</td>
                  <td>Rs. {amountDue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </form>
      </div>
    </div>
  );
};

export default SummaryForm;