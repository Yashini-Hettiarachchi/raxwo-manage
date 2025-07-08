////////////supplier///////////

import React, { useState } from 'react';
import '../styles/Supplier.css';

const PaymentForm = ({ supplier, closeModal, refreshSuppliers, darkMode }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState(null);

  // Calculate total cost and amount due
  const totalCost = supplier.items.reduce(
    (sum, item) => sum + (item.buyingPrice || 0) * (item.quantity || 0),
    0
  );
  const totalPayments = supplier.totalPayments || 0;
  const totalAmountDue = totalCost - totalPayments;
  const remainingDue = totalAmountDue - (parseFloat(paymentAmount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payment = parseFloat(paymentAmount);
    if (!payment || payment <= 0) {
      setError('Payment amount must be a positive number');
      return;
    }
    if (payment > totalAmountDue) {
      setError('Payment amount cannot exceed amount due');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5002/api/suppliers/${supplier._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAmount: payment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }

      await refreshSuppliers();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={closeModal}>
      <div className={`payment-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h3 className="payment-modal-title">Record Payment for {supplier.supplierName}</h3>
          <button className="payment-modal-close-icon" onClick={closeModal}>
            ✕
          </button>
        </div>
        <form className="payment-form" onSubmit={handleSubmit}>
          <div>
            <label className="payment-label">Total Amount Due</label>
            <input
              className="payment-display"
              type="text"
              value={`Rs. ${totalAmountDue.toFixed(2)}`}
              readOnly
            />
          </div>
          <div>
            <label className="payment-label">Current Payment Amount</label>
            <input
              className="payment-input"
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
            />
          </div>
          <div>
            <label className="payment-label">Remaining Amount Due</label>
            <input
              className="payment-display"
              type="text"
              value={`Rs. ${remainingDue >= 0 ? remainingDue.toFixed(2) : '0.00'}`}
              readOnly
            />
          </div>
          {error && <p className="payment-error">{error}</p>}
          <button type="submit" className="payment-submit-btn">
            Submit Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;