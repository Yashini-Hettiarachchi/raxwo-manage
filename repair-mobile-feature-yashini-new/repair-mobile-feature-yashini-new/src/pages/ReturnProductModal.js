import React, { useState } from 'react';
import '../styles/ReturnProduct.css';

const ReturnProductModal = ({ product, closeModal, darkMode}) => {
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnType, setReturnType] = useState('in-stock'); // Default: Return in stock

  const handleReturn = async () => {
    if (!returnQuantity || returnQuantity <= 0) {
      alert('Enter a valid return quantity');
      return;
    }

    const updatedStock = returnType === 'out-stock'
      ? product.stock - Number(returnQuantity)
      : product.stock;

    if (returnType === 'out-stock' && updatedStock < 0) {
      alert('Return quantity exceeds available stock.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5002/api/products/return/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnQuantity, returnType }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Product returned successfully');
        closeModal();
      } else {
        alert(data.message || 'Error processing return');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error processing return');
    }
  };

  if (!product) {
    return null; // Return null if product is not defined
  }

  return (
    <div className="modal-overlay">
      <div className={`modal-container ${darkMode ? "dark" : ""}`}>
        <h3 className="modal-title">Return Product: {product.itemName}</h3>

        <div className="product-info-section">
          <div className="product-info-item">
            <span className={`info-label ${darkMode ? "dark" : ""}`}>Item Code:</span>
            <span className={`info-value ${darkMode ? "dark" : ""}`}>{product.itemCode}</span>
          </div>
          <div className="product-info-item">
            <span className={`info-label ${darkMode ? "dark" : ""}`}>Supplier:</span>
            <span className={`info-value supplier-value ${darkMode ? "dark" : ""}`}>{product.supplierName || 'N/A'}</span>
          </div>
          <div className="product-info-item">
            <span className={`info-label ${darkMode ? "dark" : ""}`}>Current Stock:</span>
            <span className={`info-value ${darkMode ? "dark" : ""}`}>{product.stock}</span>
          </div>
        </div>

        <label className={`re-p-label ${darkMode ? "dark" : ""}`}>QUANTITY TO RETURN:</label>
        <input
          type="number"
          value={returnQuantity}
          onChange={(e) => setReturnQuantity(e.target.value)}
        />

        <label className={`re-p-label ${darkMode ? "dark" : ""}`}>RETURN TYPE:</label>
        <select value={returnType} onChange={(e) => setReturnType(e.target.value)}>
          <option value="in-stock">RETURN TO STOCK</option>
          <option value="out-stock">RETURN OUT OF STOCK</option>
        </select>

        <div className="button-group">
          <button onClick={handleReturn} className="r-p-submit-btn">Return</button>
          <button onClick={closeModal} className="r-p-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ReturnProductModal;