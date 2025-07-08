import React, { useState, useEffect } from 'react';
import '../Products.css';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api/suppliers';
const PRODUCTS_API_URL = 'http://localhost:5002/api/products';

const CartForm = ({ supplier, item, closeModal, darkMode, refreshProducts }) => {
  const [grn, setGrn] = useState('');
  const [items, setItems] = useState([{
    itemName: '',
    category: '',
    stock: '',
    buyingPrice: '',
    sellingPrice: '',
    supplierName: '',
  }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (item) {
      setGrn(item.itemCode || '');
      setItems([{
        itemName: item.itemName || '',
        category: item.category || '',
        stock: item.quantity?.toString() || '',
        buyingPrice: item.buyingPrice?.toString() || '',
        sellingPrice: item.sellingPrice?.toString() || '',
        supplierName: item.supplierName || supplier.supplierName || '',
      }]);
    } else {
      setGrn('');
      setItems([{
        itemName: '',
        category: '',
        stock: '',
        buyingPrice: '',
        sellingPrice: '',
        supplierName: supplier.supplierName || '',
      }]);
    }
    setMessage('');
    setError('');
    setIsSubmitted(false);
  }, [item, supplier]);

  const handleGrnChange = (e) => {
    setGrn(e.target.value);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      itemName: '',
      category: '',
      stock: '',
      buyingPrice: '',
      sellingPrice: '',
      supplierName: supplier.supplierName || '',
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };

  const validateItems = () => {
    if (!grn.trim()) {
      setError('GRN is required');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName.trim()) {
        setError(`Item Name is required for item ${i + 1}`);
        return false;
      }
      if (!item.category.trim()) {
        setError(`Category is required for item ${i + 1}`);
        return false;
      }
      if (!item.stock || Number(item.stock) < 0) {
        setError(`Stock must be a non-negative number for item ${i + 1}`);
        return false;
      }
      if (!item.buyingPrice || Number(item.buyingPrice) < 0) {
        setError(`Buying Price must be a non-negative number for item ${i + 1}`);
        return false;
      }
      if (!item.sellingPrice || Number(item.sellingPrice) < 0) {
        setError(`Selling Price must be a non-negative number for item ${i + 1}`);
        return false;
      }
      if (!item.supplierName.trim()) {
        setError(`Supplier Name is required for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setLoading(true);
    setMessage('');
    setError('');

    if (!validateItems()) {
      setLoading(false);
      setIsSubmitted(false);
      return;
    }

    try {
      // Get the current user's name from localStorage
      const changedBy = localStorage.getItem('username') || 'system';
      // Process each item
      for (let i = 0; i < items.length; i++) {
        const itemData = {
          itemCode: grn,
          ...items[i],
          quantity: parseInt(items[i].stock) || 0,
          buyingPrice: Number(items[i].buyingPrice) || 0,
          sellingPrice: Number(items[i].sellingPrice) || 0,
          changedBy // Add changedBy to the request body
        };

        const url = item ? `${API_URL}/${supplier._id}/items/${item.index}` : `${API_URL}/${supplier._id}/items`;
        const method = item ? 'PATCH' : 'POST';
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${item ? 'update' : 'add'} item ${i + 1}`);
        }

        const productResponse = await fetch(`${PRODUCTS_API_URL}/update-stock/${itemData.itemCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newStock: itemData.quantity,
            newBuyingPrice: itemData.buyingPrice,
            newSellingPrice: itemData.sellingPrice,
            itemName: itemData.itemName,
            category: itemData.category,
            supplierName: itemData.supplierName,
          }),
        });

        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(errorData.message || `Failed to update product stock for item ${i + 1}`);
        }
      }

      if (refreshProducts) {
        refreshProducts();
      }

      if (!item) {
        setGrn('');
        setItems([{
          itemName: '',
          category: '',
          stock: '',
          buyingPrice: '',
          sellingPrice: '',
          supplierName: supplier.supplierName || '',
        }]);
      }

      setMessage('');
      setError('');
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (err) {
      setError(err.message);
      setIsSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLoading(false);
    setIsSubmitted(false);
    setMessage('');
    setError('');
    closeModal();
  };

  return (
    <div className="modal-overlay">
      <div className={`pro-edit-modal-container ${darkMode ? 'dark' : ''}`}>
        <h2 className="modal-title">{item ? '✏️ Edit Item' : '🛒 Add Items to Cart'}</h2>
        {loading && <p className="loading">{item ? 'Updating' : 'Adding'} items...</p>}
        {error && <p className="error-message">{error}</p>}
        <form className="edit-product-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="left-column">
              <h3 className={`ap-h3 ${darkMode ? 'dark' : ''}`}>GRN DETAILS</h3>
              <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>GRN</label>
              <input
                className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                type="text"
                value={grn}
                onChange={handleGrnChange}
                required
              />
            </div>
          </div>
          
          {items.map((itemData, index) => (
            <div key={index} className="form-row">
              <div className="left-column">
                <h3 className={`ap-h3 ${darkMode ? 'dark' : ''}`}>ITEM {index + 1} DETAILS</h3>
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>ITEM NAME</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="text"
                  value={itemData.itemName}
                  onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                  required
                />
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>CATEGORY</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="text"
                  value={itemData.category}
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                  required
                />
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>STOCK</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="number"
                  value={itemData.stock}
                  onChange={(e) => handleItemChange(index, 'stock', e.target.value)}
                  required
                  min="0"
                />
              </div>
              <div className="right-column">
                <h3 className={`ap-h3 ${darkMode ? 'dark' : ''}`}>PRICES</h3>
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>BUYING PRICE</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="number"
                  value={itemData.buyingPrice}
                  onChange={(e) => handleItemChange(index, 'buyingPrice', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>SELLING PRICE</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="number"
                  value={itemData.sellingPrice}
                  onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
                <label className={`pro-edit-label ${darkMode ? 'dark' : ''}`}>SUPPLIER</label>
                <input
                  className={`pro-edit-input ${darkMode ? 'dark' : ''}`}
                  type="text"
                  value={itemData.supplierName}
                  onChange={(e) => handleItemChange(index, 'supplierName', e.target.value)}
                  required
                  readOnly
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => removeItem(index)}
                  >
                    Remove Item
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="button-group">
            <button type="button" className="add-item-btn" onClick={addItem}>
              ➕ Add Another Item
            </button>
            <button type="submit" className="pro-edit-submit-btn" disabled={loading}>
              {loading ? 'Saving...' : item ? 'UPDATE ITEM' : `ADD ${items.length} ITEM${items.length > 1 ? 'S' : ''}`}
            </button>
            <button type="button" className="A-l-cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CartForm; 