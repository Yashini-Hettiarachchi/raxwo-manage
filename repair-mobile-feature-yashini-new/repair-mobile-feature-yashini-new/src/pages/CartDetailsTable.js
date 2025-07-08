import React, { useState, useEffect } from 'react';
import CartForm from './CartForm';
import '../Products.css';
import editicon from '../icon/edit.png';
import deleteicon from '../icon/delete.png';
import saveicon from '../icon/sucess.png';

const API_URL = 'http://localhost:5002/api/suppliers';
const PRODUCT_API_URL = 'http://localhost:5002/api/products';

const CartDetailsTable = ({ supplierId, darkMode, refreshSuppliers }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/${supplierId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch supplier items: ${response.statusText}`);
      }
      const data = await response.json();
      setItems(data.items || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching items');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [supplierId]);

  const handleEdit = (item, index) => {
    setEditItem({ ...item, index });
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleDelete = async (index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${API_URL}/${supplierId}/items/${index}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete item');
        }
        setItems(items.filter((_, i) => i !== index));
        refreshSuppliers();
        setShowActionMenu(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSave = async (item) => {
    try {
      const response = await fetch(`${PRODUCT_API_URL}/update-stock/${item.itemCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStock: item.quantity,
          newBuyingPrice: item.buyingPrice,
          newSellingPrice: item.sellingPrice,
          itemName: item.itemName,
          category: item.category,
          supplierName: item.supplierName,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save item to product stock');
      }
      setItems(items.filter((_, i) => i !== item.index));
      refreshSuppliers();
      setShowActionMenu(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`cart-details-container ${darkMode ? 'dark' : ''}`}>
      <h3 className={`cart-details-title ${darkMode ? 'dark' : ''}`}>Cart Items</h3>
      {loading && <p className="loading">Loading items...</p>}
      {error && (
        <>
          <p className="error-message">{error}</p>
          <button onClick={fetchItems} className="supplier-retry-btn">
            Retry
          </button>
        </>
      )}
      {!loading && items.length === 0 ? (
        <p className="no-products">No items in cart.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Buying Price</th>
              <th>Selling Price</th>
              <th>Supplier</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.itemCode || 'N/A'}</td>
                <td>{item.itemName || 'N/A'}</td>
                <td>{item.category || 'N/A'}</td>
                <td>{item.quantity || '0'}</td>
                <td>Rs. {item.buyingPrice || '0'}</td>
                <td>Rs. {item.sellingPrice || '0'}</td>
                <td>{item.supplierName || 'N/A'}</td>
                <td>
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === index ? null : index);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === index && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleEdit(item, index)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={editicon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(index)} className="p-delete-btn">
                          <div className="action-btn-content">
                            <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                            <span>Delete</span>
                          </div>
                        </button>
                        <button onClick={() => handleSave({ ...item, index })} className="p-save-btn">
                          <div className="action-btn-content">
                            <img src={saveicon} alt="save" width="30" height="30" className="p-save-btn-icon" />
                            <span>Save</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showEditModal && editItem && (
        <CartForm
          supplier={{ _id: supplierId }}
          item={editItem}
          closeModal={() => {
            setShowEditModal(false);
            setEditItem(null);
            fetchItems();
            refreshSuppliers();
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default CartDetailsTable;