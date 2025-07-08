import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/CustomerDetailsTable.css';
import deleteIcon from '../icon/delete.png';

const API_URL = 'http://localhost:5002/api/payments';

const CustomerDetailsTable = ({ darkMode }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    console.log('CustomerDetailsTable - Fetching payments, Token available:', !!token); // Log token presence
    let headers = {};
    // Temporarily bypass authentication for testing (remove this line in production)
    // const bypassAuth = true; // Set to false to revert to authenticated fetch
    const bypassAuth = false; // Default to authenticated for now

    if (!bypassAuth && token) {
      headers = { "Authorization": `Bearer ${token}` };
      console.log('CustomerDetailsTable - Using authenticated fetch');
    } else {
      console.log('CustomerDetailsTable - Using unauthenticated fetch');
    }

    try {
      const response = await fetch(API_URL, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log('CustomerDetailsTable - Raw fetched data:', data); // Log raw response
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('CustomerDetailsTable - Fetch error:', err.message);
      setError(`Failed to fetch payments: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${paymentId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete customer record: ${response.statusText} (Status: ${response.status})`);
      }

      setPayments(payments.filter(payment => payment._id !== paymentId));
      setShowActionMenu(null);
      console.log('CustomerDetailsTable - Payment deleted, new payments count:', payments.length - 1);
    } catch (err) {
      console.error('CustomerDetailsTable - Delete error:', err.message);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  const filteredPayments = payments.filter(payment =>
    (payment.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payment.contactNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payment.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payment.invoiceNumber || '').toString().includes(searchQuery.toLowerCase()) ||
    new Date(payment.date).toLocaleDateString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`customer-details-container ${darkMode ? 'dark' : ''}`}>
      <div className="header-section">
        <h2 className={`customer-details-title ${darkMode ? 'dark' : ''}`}>
          CUSTOMER DETAILS
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder=" Search Customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`customer-details-search-bar ${darkMode ? 'dark' : ''}`}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading">Loading customer details...</p>
      ) : filteredPayments.length === 0 ? (
        <p className="no-customers">No customer details found.</p>
      ) : (
        <table className={`customer-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice No.</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => {
              console.log('Payment object details:', {
                _id: payment._id,
                invoiceNumber: payment.invoiceNumber,
                date: payment.date,
                isWholesale: payment.isWholesale,
                customerName: payment.customerName,
                contactNumber: payment.contactNumber,
                address: payment.address,
                customerDetails: payment.customerDetails
              });
              return (
                <tr key={payment._id}>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>{payment.invoiceNumber}</td>
                  <td>{payment.isWholesale && payment.customerDetails?.customerName ? payment.customerDetails.customerName : payment.customerName || 'N/A'}</td>
                  <td>{payment.isWholesale && payment.customerDetails?.mobile ? payment.customerDetails.mobile : payment.contactNumber || 'N/A'}</td>
                  <td>{payment.isWholesale && payment.customerDetails?.address ? payment.customerDetails.address : payment.address || 'N/A'}</td>
                  <td>
                    <div className="action-container">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowActionMenu(showActionMenu === payment._id ? null : payment._id);
                        }}
                        className="action-dot-btn"
                      >
                        ⋮
                      </button>
                      {showActionMenu === payment._id && (
                        <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                          <button onClick={() => handleDelete(payment._id)} className="c-delete-btn">
                            <div className="action-btn-content">
                              <img src={deleteIcon} alt="delete" width="30" height="30" className="c-delete-btn-icon" />
                              <span>Delete</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerDetailsTable;