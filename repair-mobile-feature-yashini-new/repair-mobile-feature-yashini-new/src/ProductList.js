import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EditProduct from './EditProduct';
import ReturnProductModal from './pages/ReturnProductModal';
import AddProduct from './AddProduct';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-3d';
import HighchartsReact from 'highcharts-react-official';
import './Products.css';
import editicon from './icon/edit.png';
import deleteicon from './icon/delete.png';
import returnicon from './icon/product-return.png';
import Barcode from './pages/Barcode';
import barcodeicon from './icon/barcode.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChartSimple, faFile, faFilePdf, faFileExcel, faSearch, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://localhost:5002/api/products';

const ProductList = ({ darkMode }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = () => {
    setLoading(true);
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleExcelUpload = async (file) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', localStorage.getItem('username') || 'system');

      const response = await fetch(`${API_URL}/upload-excel`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        const errorMessage = `Upload completed with ${result.errors.length} errors:\n` +
          result.errors.map(err => `Row ${err.row}: ${err.error}`).join('\n');
        alert(errorMessage);
      } else {
        alert(`Excel upload successful!\n${result.successful} products processed.`);
      }
      
      // Refresh the product list
      fetchProducts();
    } catch (err) {
      setError(err.message);
      alert('Error uploading Excel file: ' + err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleExcelUpload(file);
    }
    event.target.value = '';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const changedBy = localStorage.getItem('username') || localStorage.getItem('cashierName') || 'system';
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changedBy }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
        setProducts(products.filter((product) => product._id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleReturn = (product) => {
    setSelectedProduct(product);
    setShowReturnModal(true);
  };

  const handleBarcode = (product) => {
    setBarcodeProduct(product);
    setShowBarcodeModal(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Product List', 90, 20);
    const tableColumn = ['GRN', 'Item Name', 'Category', 'Buying Price', 'Selling Price', 'Stock', 'Supplier', 'Status', 'Created At'];
    const tableRows = products.map((product) => [
      product.itemCode || 'N/A',
      product.itemName,
      product.category,
      `Rs. ${product.buyingPrice}`,
      `Rs. ${product.sellingPrice}`,
      product.stock,
      product.supplierName || 'N/A',
      product.stock > 0 ? 'In Stock' : 'Out of Stock',
      product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A',
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save('Product_List.pdf');
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const formattedProducts = products.map((product) => ({
      'GRN': product.itemCode || 'N/A',
      'Item Name': product.itemName,
      Category: product.category,
      'Buying Price': `Rs. ${product.buyingPrice}`,
      'Selling Price': `Rs. ${product.sellingPrice}`,
      Stock: product.stock,
      Supplier: product.supplierName || 'N/A',
      Status: product.stock > 0 ? 'In Stock' : 'Out of Stock',
      'Created At': product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'Product_List.xlsx');
    setShowReportOptions(false);
  };

  const calculateMonthlySummary = () => {
    const monthlyData = {};
    let totalBuyingPrice = 0;

    products.forEach((product) => {
      const date = product.createdAt ? new Date(product.createdAt) : new Date();
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      const productBuyingPrice = product.buyingPrice * product.stock;
      monthlyData[monthYear] += productBuyingPrice;
      totalBuyingPrice += productBuyingPrice;
    });

    const months = Object.keys(monthlyData);
    const prices = months.map((month) => monthlyData[month]);

    return { monthlyData, totalBuyingPrice, months, prices };
  };

  const { monthlyData, totalBuyingPrice, months, prices } = calculateMonthlySummary();

  const chartOptions = {
    chart: {
      type: 'column',
      options3d: {
        enabled: true,
        alpha: 1,
        beta: 0,
        depth: 50,
        viewDistance: 25,
        frame: {
          bottom: { size: 1, color: darkMode ? 'rgba(251, 251, 251, 0.1)' : 'whitesmoke' },
          side: { size: 0 },
          back: { size: 0 },
        },
      },
      backgroundColor: darkMode ? 'rgba(251, 251, 251, 0.1)' : 'whitesmoke',
      borderWidth: 0,
    },
    title: {
      text: 'Monthly Buying Prices',
      style: { color: darkMode ? '#ffffff' : '#000000', fontFamily: "'Inter', sans-serif", fontSize: '18px' },
    },
    xAxis: {
      categories: months,
      labels: {
        style: {
          color: darkMode ? '#ffffff' : '#000000',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
        },
      },
      lineColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(82, 82, 82, 0.2)',
    },
    yAxis: {
      title: { text: null },
      labels: {
        style: {
          color: darkMode ? '#ffffff' : '#000000',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
        },
        formatter: function () {
          return `Rs. ${Highcharts.numberFormat(this.value, 0)}`;
        },
      },
      gridLineColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      lineColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(82, 82, 82, 0.2)',
      lineWidth: 1,
      offset: 0,
    },
    plotOptions: {
      column: {
        depth: 25,
        pointWidth: 20,
        groupPadding: 0.2,
        pointPadding: 0.05,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: 'Rs. {y}',
          style: {
            color: darkMode ? '#ffffff' : '#000000',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            textOutline: 'none',
          },
        },
      },
    },
    series: [
      {
        name: 'Buying Price',
        data: prices,
        colors: ['#1e90ff', '#ff4040', '#32cd32', '#ffcc00', '#ff69b4', '#8a2be2'],
      },
    ],
    legend: {
      enabled: false,
    },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(245, 245, 245, 0.9)',
      style: {
        color: darkMode ? '#ffffff' : '#000000',
        fontFamily: "'Inter', sans-serif",
      },
      formatter: function () {
        return `<b>${this.x}</b>: Rs. ${Highcharts.numberFormat(this.y, 2)}`;
      },
    },
  };

  const filteredProducts = products.filter((product) =>
    (product.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      <div className="header-section">
        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
          PRODUCT STOCK
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
            <button onClick={handleClearSearch} className={`search-clear-btn ${darkMode ? 'dark' : ''}`}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <div className='filter-action-row'>
          <button onClick={() => setSummaryModalOpen(true)} className="btn-summary">
            <FontAwesomeIcon icon={faChartSimple} /> Summary
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
          />
          <button onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ background: '#1D6F42' }}>
            <FontAwesomeIcon icon={faUpload} /> Upload Excel
          </button>
          <button onClick={() => setShowReportOptions(true)} className="btn-report">
            <FontAwesomeIcon icon={faFile} /> Reports
          </button>
        </div>
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div
            className={`report-modal-content ${darkMode ? 'dark' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="report-modal-header">
              <h3 className="sup-report-modal-title">Select Report Type</h3>
              <button
                onClick={() => setShowReportOptions(false)}
                className="report-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="report-modal-buttons">
              <button onClick={generateExcel} className="btn-report" style={{ background: 'green' }}>
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button onClick={generatePDF} className="btn-report" style={{ background: 'red' }}>
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="no-products">No products available.</p>
      ) : (
        <>
          <table className={`product-table ${darkMode ? 'dark' : ''}`}>
            <thead>
              <tr>
                {/* <th>GRN</th> */}
                <th>Item Name</th>
                <th>Category</th>
                <th>Buying Price</th>
                <th>Selling Price</th>
                <th>Stock</th>
                {/* <th>Supplier</th> */}
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  {/* <td>{product.itemCode || 'N/A'}</td> */}
                  <td>{product.itemName}</td>
                  <td>{product.category}</td>
                  <td>Rs. {product.buyingPrice.toFixed(2)}</td>
                  <td>Rs. {product.sellingPrice.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  {/* <td>{product.supplierName || 'N/A'}</td> */}
                  <td>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</td>
                  <td>{product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}</td>
                  <td>
                    <div className="action-container">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowActionMenu(showActionMenu === product._id ? null : product._id);
                        }}
                        className="action-dot-btn"
                      >
                        ⋮
                      </button>
                      {showActionMenu === product._id && (
                        <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                          <button onClick={() => handleEdit(product)} className="p-edit-btn">
                            <div className="action-btn-content">
                              <img src={editicon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                              <span>Edit</span>
                            </div>
                          </button>
                          <button onClick={() => handleDelete(product._id)} className="p-delete-btn">
                            <div className="action-btn-content">
                              <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                              <span>Delete</span>
                            </div>
                          </button>
                          <button onClick={() => handleReturn(product)} className="p-return-btn">
                            <div className="action-btn-content">
                              <img src={returnicon} alt="return" width="30" height="30" className="p-return-btn-icon" />
                              <span>Return</span>
                            </div>
                          </button>
                          <button onClick={() => handleBarcode(product)} className="p-barcode-btn">
                            <div className="action-btn-content">
                              <img src={barcodeicon} alt="barcode" width="30" height="30" className="p-barcode-btn-icon" />
                              <span>Barcode</span>
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
        </>
      )}
      {showModal && selectedProduct && (
        <EditProduct
          product={selectedProduct}
          closeModal={() => {
            setShowModal(false);
            fetchProducts();
          }}
          darkMode={darkMode}
        />
      )}
      {showReturnModal && selectedProduct && (
        <ReturnProductModal
          product={selectedProduct}
          closeModal={() => setShowReturnModal(false)}
          darkMode={darkMode}
        />
      )}
      {showAddModal && (
        <AddProduct
          closeModal={() => {
            setShowAddModal(false);
            fetchProducts();
          }}
          darkMode={darkMode}
        />
      )}
      {showBarcodeModal && barcodeProduct && (
        <Barcode
          itemCode={barcodeProduct.itemCode}
          itemName={barcodeProduct.itemName}
          sellingPrice={barcodeProduct.sellingPrice}
          darkMode={darkMode}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
      {summaryModalOpen && (
        <div className="product-summary-modal-overlay">
          <div className={`product-summary-modal-content ${darkMode ? 'dark' : ''}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Product Buying Price Summary</h3>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="product-summary-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="product-summary-content">
              <div className="product-summary-card">
                <div className="product-summary-icon product-summary-total-icon">💸</div>
                <div className="product-summary-text">
                  <h4>Total Buying Price</h4>
                  <p>Rs. {totalBuyingPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="product-summary-chart-container">
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;