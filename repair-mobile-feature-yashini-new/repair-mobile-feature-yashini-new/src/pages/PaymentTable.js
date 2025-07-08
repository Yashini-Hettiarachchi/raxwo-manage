import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Highcharts from "highcharts";
import "highcharts/highcharts-3d";
import HighchartsReact from "highcharts-react-official";
import '../styles/PaymentTable.css';
import deleteIcon from "../icon/delete.png";

const API_URL = 'http://localhost:5002/api/payments';

const PaymentTable = ({ darkMode }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
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
        throw new Error(`Failed to delete payment: ${response.statusText}`);
      }

      setPayments(payments.filter(payment => payment._id !== paymentId));
      setShowActionMenu(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateSummary = () => {
    const totalIncome = payments
      .filter(payment => payment.paymentMethod !== 'Refund')
      .reduce((sum, payment) => sum + payment.totalAmount, 0);
    const totalProfit = payments
      .filter(payment => payment.paymentMethod !== 'Refund')
      .reduce((sum, payment) => sum + (payment.totalAmount - (payment.discountApplied || 0)), 0);
    return { totalIncome, totalProfit };
  };

  const { totalIncome, totalProfit } = calculateSummary();

  const chartOptions = {
    chart: {
      type: "column",
      options3d: {
        enabled: true,
        alpha: 0,
        beta: 1,
        depth: 50,
        viewDistance: 15,
        frame: {
          bottom: { size: 1, color: darkMode ? "rgba(251, 251, 251, 0.1)" : "whitesmoke" },
          side: { size: 0 },
          back: { size: 0 },
        },
      },
      backgroundColor: darkMode ? "rgba(251, 251, 251, 0.1)" : "whitesmoke",
      borderWidth: 0,
    },
    title: {
      text: "Income vs Profit",
      style: { color: darkMode ? "#ffffff" : "#000000", fontFamily: "'Inter', sans-serif", fontSize: "18px" },
    },
    xAxis: {
      categories: ["Summary"],
      labels: {
        style: {
          color: darkMode ? "#ffffff" : "#000000",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
        },
      },
      lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(82, 82, 82, 0.2)",
    },
    yAxis: {
      title: { text: null },
      labels: {
        style: {
          color: darkMode ? "#ffffff" : "#000000",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
        },
        formatter: function () {
          return `Rs. ${Highcharts.numberFormat(this.value, 0)}`;
        },
      },
      gridLineColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(82, 82, 82, 0.2)",
      lineWidth: 1,
      offset: 0,
    },
    plotOptions: {
      column: {
        depth: 25,
        pointWidth: 30,
        groupPadding: 0.2,
        pointPadding: 0.05,
        colorByPoint: false,
        dataLabels: {
          enabled: true,
          format: "Rs. {y}",
          style: {
            color: darkMode ? "#ffffff" : "#000000",
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            textOutline: "none",
          },
        },
      },
    },
    series: [
      {
        name: "Income",
        data: [totalIncome],
        color: "#1e90ff",
      },
      {
        name: "Profit",
        data: [totalProfit],
        color: "#ff4040",
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        color: darkMode ? "#ffffff" : "#000000",
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
      },
    },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(245, 245, 245, 0.9)",
      style: {
        color: darkMode ? "#ffffff" : "#000000",
        fontFamily: "'Inter', sans-serif",
      },
      formatter: function () {
        return `<b>${this.series.name}</b>: Rs. ${Highcharts.numberFormat(this.y, 2)}`;
      },
    },
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Payment List', 90, 20);
    const tableColumn = [
      'Date',
      'Time',
      'Invoice No.',
      'Item Name',
      'Quantity',
      'Payment Method',
      'Cashier Name',
      'Cashier ID',
      'Total Amount',
      'Discount',
    ];
    const tableRows = filteredPayments.flatMap(payment =>
      payment.items.map(item => [
        new Date(payment.date).toLocaleDateString(),
        new Date(payment.date).toLocaleTimeString(),
        payment.invoiceNumber,
        item.itemName,
        item.quantity,
        payment.paymentMethod,
        payment.cashierName,
        payment.cashierId,
        `Rs. ${payment.totalAmount.toFixed(2)}`,
        `Rs. ${(payment.discountApplied || 0).toFixed(2)}`,
      ])
    );
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save('Payment_List.pdf');
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const formattedPayments = filteredPayments.flatMap(payment =>
      payment.items.map(item => ({
        Date: new Date(payment.date).toLocaleDateString(),
        Time: new Date(payment.date).toLocaleTimeString(),
        'Invoice Number': payment.invoiceNumber,
        'Item Name': item.itemName,
        Quantity: item.quantity,
        'Payment Method': payment.paymentMethod,
        'Cashier Name': payment.cashierName,
        'Cashier ID': payment.cashierId,
        'Total Amount': `Rs. ${payment.totalAmount.toFixed(2)}`,
        Discount: `Rs. ${(payment.discountApplied || 0).toFixed(2)}`,
      }))
    );
    const worksheet = XLSX.utils.json_to_sheet(formattedPayments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, 'Payment_List.xlsx');
    setShowReportOptions(false);
  };

  const filteredPayments = payments.filter(payment =>
    payment.items.some(item =>
      (item.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.invoiceNumber || '').toString().includes(searchQuery.toLowerCase()) ||
      (payment.cashierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.cashierId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.paymentMethod || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(payment.date).toLocaleDateString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(payment.date).toLocaleTimeString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
        PAYMENT TRANSACTIONS
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Payments..."
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

        <button onClick={() => setShowModal(true)} className="btn-summary">
          <FontAwesomeIcon icon={faChartSimple} /> Summary
        </button>
        <button onClick={() => setShowReportOptions(true)} className="btn-report">
          <FontAwesomeIcon icon={faFile} /> Reports
        </button>
        </div>
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3 className="report-modal-title">Select Report Type</h3>
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
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading">Loading payments...</p>
      ) : filteredPayments.length === 0 ? (
        <p className="no-products">No payments found.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Invoice No.</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Payment Method</th>
              <th>Cashier Name</th>
              <th>Discount</th>
              <th>Total Amount</th>
              <th>Cashier ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.flatMap(payment =>
              payment.items.map((item, index) => (
                <tr key={`${payment._id}-${index}`}>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>{new Date(payment.date).toLocaleTimeString()}</td>
                  <td>{payment.invoiceNumber}</td>
                  <td>{item.itemName}</td>
                  <td>{item.quantity}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.cashierName}</td>
                  <td>Rs. {(payment.discountApplied || 0).toFixed(2)}</td>
                  <td>Rs. {payment.totalAmount.toFixed(2)}</td>
                  <td>{payment.cashierId}</td>
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
                          <button onClick={() => handleDelete(payment._id)} className="p-delete-btn">
                            <div className="action-btn-content">
                              <img src={deleteIcon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                              <span>Delete</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="product-summary-modal-overlay">
          <div className={`product-summary-modal-content ${darkMode ? 'dark' : ''}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Payment Summary</h3>
              <button
                onClick={() => setShowModal(false)}
                className="product-summary-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="product-summary-content">
              <div className="summary-card">
                <div className="summary-icon income-icon">💰</div>
                <div className="summary-text">
                  <h4>Total Income</h4>
                  <p>Rs. {totalIncome.toFixed(2)}</p>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon profit-icon">📈</div>
                <div className="summary-text">
                  <h4>Total Profit</h4>
                  <p>Rs. {totalProfit.toFixed(2)}</p>
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

export default PaymentTable;