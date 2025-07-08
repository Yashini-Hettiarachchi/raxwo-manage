import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddSupplier from './AddSupplier';
import CartForm from './CartForm';
import SummaryForm from '../components/SummaryForm';
import PaymentForm from '../components/PaymentForm';
import suppliericon from '../icon/add (1).png';
import '../styles/Supplier.css';
import editicon from '../icon/edit.png';
import deleteicon from '../icon/delete.png';
import cart from '../icon/shopping-cart.png';
import viewicon from '../icon/clipboard.png';
import payicon from '../icon/payment.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes, faChartBar } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TbBackground } from 'react-icons/tb';

const SupplierList = ({ darkMode }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [itemDetails, setItemDetails] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('http://localhost:5002/api/suppliers', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
      }
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching suppliers');
      setSuppliers([]);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products');
    }
  };

  const refreshProducts = () => {
    fetchProducts();
    setTimeout(() => setNotification(''), 5000);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowAddSupplierModal(true);
    setShowActionMenu(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const changedBy = localStorage.getItem('username') || localStorage.getItem('cashierName') || 'system';
        const response = await fetch(`http://localhost:5002/api/suppliers/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changedBy }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete supplier');
        }
        setSuppliers(suppliers.filter((supplier) => supplier._id !== id));
        setShowActionMenu(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCart = (supplier) => {
    setSelectedSupplier(supplier);
    setShowCartModal(true);
    setShowActionMenu(null);
  };

  const handlePay = (supplier) => {
    setSelectedSupplier(supplier);
    setShowPaymentModal(true);
    setShowActionMenu(null);
  };

  const handleView = (supplierId) => {
    navigate(`/suppliers/${supplierId}/cart`);
    setShowActionMenu(null);
  };

  const handleItemDetails = () => {
    setShowItemDetailsModal(true);
  };

  const fetchItemDetails = async () => {
    if (!selectedSupplier || !selectedItemCode) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5002/api/products?itemCode=${selectedItemCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch item details');
      }
      const data = await response.json();
      const filteredData = (Array.isArray(data) ? data : data.products || []).filter(
        (product) => product.supplierName === selectedSupplier.supplierName && product.itemCode === selectedItemCode
      );
      setItemDetails(filteredData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Supplier List', 90, 20);
    const tableColumn = ['Supplier Name', 'Business Name', 'Phone Number', 'Address'];
    const tableRows = suppliers.map((supplier) => [
      supplier.supplierName || 'N/A',
      supplier.businessName || 'N/A',
      supplier.phoneNumber || 'N/A',
      supplier.address || 'N/A',
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save('Supplier_List.pdf');
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const formattedSuppliers = suppliers.map((supplier) => ({
      'Supplier Name': supplier.supplierName || 'N/A',
      'Business Name': supplier.businessName || 'N/A',
      'Phone Number': supplier.phoneNumber || 'N/A',
      Address: supplier.address || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedSuppliers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, 'Supplier_List.xlsx');
    setShowReportOptions(false);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      (supplier.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.businessName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      <div className="header-section">
        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
          SUPPLIER LIST
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`product-list-search-bar ${darkMode ? 'dark' : ''}`}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <div className='filter-action-row'>
          <button onClick={() => setShowAddSupplierModal(true)} className="btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Add Supplier
          </button>
          <button onClick={() => setShowSummaryModal(true)} className="btn-summary">
            <FontAwesomeIcon icon={faChartBar} /> Summary
          </button>
          <button onClick={handleItemDetails} className="btn-summary">
            <FontAwesomeIcon icon={faChartBar} /> Item Details
          </button>
          <button onClick={() => setShowReportOptions(true)} className="btn-report">
            <FontAwesomeIcon icon={faFile} /> Reports
          </button>
        </div>
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header" >
              <h3 className="sup-report-modal-title" >Select Report Type</h3>
              <button
                onClick={() => setShowReportOptions(false)}
                className="report-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="report-modal-buttons">
              <button
                onClick={generateExcel}
                className="btn-report-e"
                style={{ background: 'green' }}
              >
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="btn-report-p"
                style={{ background: 'red' }}
              >
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {showSummaryModal && (
        <SummaryForm
          suppliers={suppliers}
          closeModal={() => setShowSummaryModal(false)}
          darkMode={darkMode}
        />
      )}
      {showPaymentModal && selectedSupplier && (
        <PaymentForm
          supplier={selectedSupplier}
          closeModal={() => {
            setShowPaymentModal(false);
            setSelectedSupplier(null);
          }}
          refreshSuppliers={fetchSuppliers}
          darkMode={darkMode}
        />
      )}
      {showItemDetailsModal && (
        <div className="product-summary-modal-overlay">
          <div className={`product-summary-modal-content ${darkMode ? 'dark' : ''}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Item Details</h3>
              <button
                onClick={() => setShowItemDetailsModal(false)}
                className="product-summary-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="item-details-selection">
              <select
                value={selectedSupplier ? selectedSupplier._id : ''}
                onChange={(e) => {
                  const supplier = suppliers.find(s => s._id === e.target.value);
                  setSelectedSupplier(supplier);
                  setSelectedItemCode(''); // Reset item code when supplier changes
                }}
                className={`item-details-select ${darkMode ? 'dark' : ''}`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
              <select
                value={selectedItemCode}
                onChange={(e) => setSelectedItemCode(e.target.value)}
                className={`item-details-select ${darkMode ? 'dark' : ''}`}
              >
                <option value="">Select GRN</option>
                {products
                  .filter(p => selectedSupplier && p.supplierName === selectedSupplier.supplierName)
                  .map((product) => (
                    <option key={product._id} value={product.itemCode}>
                      {product.itemCode}
                    </option>
                  ))}
              </select>
              <button
                onClick={fetchItemDetails}
                className="btn-primary"
                disabled={!selectedSupplier || !selectedItemCode}
              >
                Fetch Details
              </button>
            </div>
            {loading ? (
              <p className="loading">Loading item details...</p>
            ) : itemDetails.length > 0 ? (
              <table className={`product-table ${darkMode ? 'dark' : ''}`}>
                <thead>
                  <tr>
                    <th>GRN</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Buying Price</th>
                    <th>Selling Price</th>
                    <th>Stock</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {itemDetails.map((product) => (
                    <tr key={product._id}>
                      <td>{product.itemCode || 'N/A'}</td>
                      <td>{product.itemName}</td>
                      <td>{product.category}</td>
                      <td>Rs. {product.buyingPrice.toFixed(2)}</td>
                      <td>Rs. {product.sellingPrice.toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.supplierName || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-products">No items found for the selected supplier and item code.</p>
            )}
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {loading && !showItemDetailsModal ? (
        <p className="loading">Loading suppliers...</p>
      ) : !suppliers || filteredSuppliers.length === 0 ? (
        <p className="no-products">No suppliers available.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Business Name</th>
              <th>Phone Number</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier._id}>
                <td>{supplier.supplierName || 'N/A'}</td>
                <td>{supplier.businessName || 'N/A'}</td>
                <td>{supplier.phoneNumber || 'N/A'}</td>
                <td>{supplier.address || 'N/A'}</td>
                <td>
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === supplier._id ? null : supplier._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === supplier._id && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleCart(supplier)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={cart} alt="cart" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Cart</span>
                          </div>
                        </button>
                        <button onClick={() => handleEdit(supplier)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={editicon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(supplier._id)} className="p-delete-btn">
                          <div className="action-btn-content">
                            <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                            <span>Delete</span>
                          </div>
                        </button>
                        <button onClick={() => handleView(supplier._id)} className="p-view-btn">
                          <div className="action-btn-content">
                            <img src={viewicon} alt="view" width="30" height="30" className="p-view-btn-icon" />
                            <span>View</span>
                          </div>
                        </button>
                        <button onClick={() => handlePay(supplier)} className="p-pay-btn">
                          <div className="action-btn-content">
                            <img src={payicon} alt="pay" width="30" height="30" className="p-pay-btn-icon" />
                            <span>Pay</span>
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
      {showAddSupplierModal && (
        <AddSupplier
          supplier={selectedSupplier}
          closeModal={() => {
            setShowAddSupplierModal(false);
            setSelectedSupplier(null);
          }}
          refreshSuppliers={fetchSuppliers}
          darkMode={darkMode}
        />
      )}
      {showCartModal && selectedSupplier && (
        <CartForm
          supplier={selectedSupplier}
          closeModal={() => {
            setShowCartModal(false);
            setSelectedSupplier(null);
            fetchSuppliers();
            refreshProducts();
          }}
          darkMode={darkMode}
          refreshProducts={refreshProducts}
        />
      )}
      {notification && (
        <div className={`notification ${darkMode ? 'dark' : ''}`}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default SupplierList;