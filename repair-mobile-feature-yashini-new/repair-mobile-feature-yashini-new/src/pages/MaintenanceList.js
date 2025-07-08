import React, { useState, useEffect } from "react";
import MaintenanceEdit from "./MaintenanceEdit";
import MaintenanceAdd from "./MaintenanceAdd";
import Highcharts from "highcharts";
import "highcharts/highcharts-3d";
import HighchartsReact from "highcharts-react-official";
import '../styles/MaintenanceList.css';
import editicon from '../icon/edit.png';
import deleteicon from '../icon/delete.png';
import mainlisticon from '../icon/repairing.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChartSimple, faFile, faFilePdf, faFileExcel, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = "http://localhost:5002/api/maintenance";

const MaintenanceList = ({ darkMode }) => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setMaintenanceRecords(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        setMaintenanceRecords(maintenanceRecords.filter(record => record._id !== id));
        setShowActionMenu(null);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowActionMenu(null);
  };

  const calculateMonthlySummary = () => {
    const monthlyData = {};
    let totalPrice = 0;

    maintenanceRecords.forEach(record => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = 0;
      monthlyData[monthYear] += record.price;
      totalPrice += record.price;
    });

    const months = Object.keys(monthlyData);
    const prices = months.map(month => monthlyData[month]);

    return { monthlyData, totalPrice, months, prices };
  };

  const { monthlyData, totalPrice, months, prices } = calculateMonthlySummary();

  const chartOptions = {
    chart: {
      type: "column",
      options3d: {
        enabled: true,
        alpha: 1,
        beta: 0,
        depth: 50,
        viewDistance: 25,
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
      text: "Monthly Maintenance Costs",
      style: { color: darkMode ? "#ffffff" : "#000000", fontFamily: "'Inter', sans-serif", fontSize: "18px" },
    },
    xAxis: {
      categories: months,
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
        pointWidth: 20,
        groupPadding: 0.2,
        pointPadding: 0.05,
        colorByPoint: true,
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
        name: "Maintenance Cost",
        data: prices,
        colors: ["#1e90ff", "#ff4040", "#32cd32", "#ffcc00", "#ff69b4", "#8a2be2"],
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(245, 245, 245, 0.9)",
      style: {
        color: darkMode ? "#ffffff" : "#000000",
        fontFamily: "'Inter', sans-serif",
      },
      formatter: function () {
        return `<b>${this.x}</b>: Rs. ${Highcharts.numberFormat(this.y, 2)}`;
      },
    },
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      maintenanceRecords.map((record, index) => ({
        No: index + 1,
        Date: record.date,
        Time: record.time,
        "Service Type": record.serviceType,
        Price: `Rs. ${record.price.toFixed(2)}`,
        Remarks: record.remarks,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Records");
    XLSX.writeFile(workbook, "Maintenance_Records.xlsx");
    setShowReportOptions(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Maintenance Records", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Date", "Time", "Service Type", "Price", "Remarks"]],
      body: maintenanceRecords.map((record, index) => [
        index + 1,
        record.date,
        record.time,
        record.serviceType,
        `Rs. ${record.price.toFixed(2)}`,
        record.remarks || 'N/A',
      ]),
    });
    doc.save("Maintenance_Records.pdf");
    setShowReportOptions(false);
  };

  const filteredRecords = maintenanceRecords.filter(record =>
    record.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.remarks || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
        MAINTENANCE RECORDS
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Maintenance..."
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

        <button onClick={() => setShowSummaryModal(true)} className="btn-summary">
          <FontAwesomeIcon icon={faChartSimple} /> Summary
        </button>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} /> Add Maintenance
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
        <p className="loading">Loading maintenance records...</p>
      ) : filteredRecords.length === 0 ? (
        <p className="no-products">No maintenance records available.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Service Type</th>
              <th>Price</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id}>
                <td>{record.date}</td>
                <td>{record.time}</td>
                <td>{record.serviceType}</td>
                <td>Rs. {record.price.toFixed(2)}</td>
                <td>{record.remarks || 'N/A'}</td>
                <td>
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === record._id ? null : record._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === record._id && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleEdit(record)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={editicon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(record._id)} className="p-delete-btn">
                          <div className="action-btn-content">
                            <img src={deleteicon} alt="delete" width="30" height="30" className="p-delete-btn-icon" />
                            <span>Delete</span>
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

      {showAddModal && (
        <div className={`m-a-modal-overlay ${darkMode ? 'dark' : ''}`} onClick={() => setShowAddModal(false)}>
          <div className={`m-a-modal-container ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <MaintenanceAdd onClose={() => setShowAddModal(false)} onUpdate={fetchMaintenanceRecords} darkMode={darkMode} />
          </div>
        </div>
      )}

      {editingRecord && (
        <MaintenanceEdit
          darkMode={darkMode}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onUpdate={fetchMaintenanceRecords}
        />
      )}

      {showSummaryModal && (
        <div className="product-summary-modal-overlay">
          <div className={`product-summary-modal-content ${darkMode ? 'dark' : ''}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Maintenance Cost Summary</h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="product-summary-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="product-summary-content">
              <div className="product-summary-card">
                <div className="product-summary-icon product-summary-total-icon">💸</div>
                <div className="product-summary-text">
                  <h4>Total Maintenance Cost</h4>
                  <p>Rs. {totalPrice.toFixed(2)}</p>
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

export default MaintenanceList;