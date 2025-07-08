import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faChartSimple, faFile, faFilePdf, faFileExcel, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import Highcharts from "highcharts";
import "highcharts/highcharts-3d";
import HighchartsReact from "highcharts-react-official";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import editicon from "../icon/edit.png";
import deleteicon from "../icon/delete.png";
import "../styles/ExtraIncome.css";

const API_URL = "http://localhost:5002/api/extra-income";

const ExtraIncome = ({ darkMode }) => {
  // State for form inputs
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    incomeType: "",
    amount: "",
    description: "",
  });
  // State for table data
  const [extraIncomes, setExtraIncomes] = useState([]);
  // State for editing
  const [editingRecord, setEditingRecord] = useState(null);
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  // State for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample data for demo mode
  const sampleData = [
    {
      _id: "1",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      incomeType: "Bonus",
      amount: 5000,
      description: "Year-end bonus",
    },
    {
      _id: "2",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      time: new Date(Date.now() - 86400000).toTimeString().slice(0, 5),
      incomeType: "Refund",
      amount: 2000,
      description: "Supplier refund",
    },
  ];

  // Fetch extra income records
  const fetchExtraIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch extra incomes");
      }
      const data = await response.json();
      setExtraIncomes(
        data.map((income) => ({
          ...income,
          date: new Date(income.date).toISOString().split("T")[0],
          time: new Date(income.date).toTimeString().slice(0, 5),
        }))
      );
    } catch (err) {
      console.error("Error fetching extra incomes:", err);
      setError("Failed to load data. Showing sample data.");
      setExtraIncomes(sampleData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraIncomes();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: `${formData.date}T${formData.time}:00.000Z`,
        incomeType: formData.incomeType,
        amount: parseFloat(formData.amount),
        description: formData.description,
      };
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to add extra income");
      }
      const newIncome = await response.json();
      setExtraIncomes([
        {
          ...newIncome,
          date: new Date(newIncome.date).toISOString().split("T")[0],
          time: new Date(newIncome.date).toTimeString().slice(0, 5),
        },
        ...extraIncomes,
      ]);
      setFormData({
        date: "",
        time: "",
        incomeType: "",
        amount: "",
        description: "",
      });
      setShowAddModal(false);
      onUpdate();
    } catch (err) {
      console.error("Error adding extra income:", err);
      setError(err.message);
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowActionMenu(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: `${editingRecord.date}T${editingRecord.time}:00.000Z`,
        incomeType: editingRecord.incomeType,
        amount: parseFloat(editingRecord.amount),
        description: editingRecord.description,
      };
      const response = await fetch(`${API_URL}/${editingRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to update extra income");
      }
      const updatedIncome = await response.json();
      setExtraIncomes(
        extraIncomes.map((income) =>
          income._id === editingRecord._id
            ? {
                ...updatedIncome,
                date: new Date(updatedIncome.date).toISOString().split("T")[0],
                time: new Date(updatedIncome.date).toTimeString().slice(0, 5),
              }
            : income
        )
      );
      setEditingRecord(null);
      onUpdate();
    } catch (err) {
      console.error("Error updating extra income:", err);
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete extra income");
        }
        setExtraIncomes(extraIncomes.filter((income) => income._id !== id));
        setShowActionMenu(null);
        onUpdate();
      } catch (err) {
        console.error("Error deleting extra income:", err);
        setError(err.message);
      }
    }
  };

  // Handle update after add/edit
  const onUpdate = () => {
    fetchExtraIncomes();
  };

  // Calculate monthly summary for chart
  const calculateMonthlySummary = () => {
    const monthlyData = {};
    let totalAmount = 0;

    extraIncomes.forEach((record) => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = 0;
      monthlyData[monthYear] += record.amount;
      totalAmount += record.amount;
    });

    const months = Object.keys(monthlyData);
    const amounts = months.map((month) => monthlyData[month]);

    return { monthlyData, totalAmount, months, amounts };
  };

  const { monthlyData, totalAmount, months, amounts } = calculateMonthlySummary();

  // Chart options for Highcharts
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
      text: "Monthly Extra Income",
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
          return Highcharts.numberFormat(this.value, 0);
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
          format: "{y}",
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
        name: "Extra Income",
        data: amounts,
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
        return `<b>${this.x}</b>: ${Highcharts.numberFormat(this.y, 2)}`;
      },
    },
  };

  // Generate Excel report
  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRecords.map((record, index) => ({
        No: index + 1,
        Date: record.date,
        Time: record.time,
        "Income Type": record.incomeType,
        Amount: record.amount.toFixed(2),
        Description: record.description || "N/A",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extra Income Records");
    XLSX.writeFile(workbook, "Extra_Income_Records.xlsx");
    setShowReportOptions(false);
  };

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Extra Income Records", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Date", "Time", "Income Type", "Amount", "Description"]],
      body: filteredRecords.map((record, index) => [
        index + 1,
        record.date,
        record.time,
        record.incomeType,
        record.amount.toFixed(2),
        record.description || "N/A",
      ]),
    });
    doc.save("Extra_Income_Records.pdf");
    setShowReportOptions(false);
  };

  // Filter records based on search query
  const filteredRecords = extraIncomes.filter(
    (record) =>
      record.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.incomeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      <div className="header-section">
        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
          EXTRA INCOME RECORDS
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? "dark" : ""}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Extra Income..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`product-list-search-bar ${darkMode ? "dark" : ""}`}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <div className="filter-action-row">
          <button onClick={() => setShowSummaryModal(true)} className="btn-summary">
            <FontAwesomeIcon icon={faChartSimple} /> Summary
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Add Extra Income
          </button>
          <button onClick={() => setShowReportOptions(true)} className="A-l-cancel-btn">
            <FontAwesomeIcon icon={faFile} /> Reports
          </button>
        </div>
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
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
                style={{ background: "green" }}
              >
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="btn-report-p"
                style={{ background: "red" }}
              >
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading">Loading extra income records...</p>
      ) : filteredRecords.length === 0 ? (
        <p className="no-products">No extra income records available.</p>
      ) : (
        <table className={`product-table ${darkMode ? "dark" : ""}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Income Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id}>
                <td>{record.date}</td>
                <td>{record.time}</td>
                <td>{record.incomeType}</td>
                <td>{record.amount.toFixed(2)}</td>
                <td>{record.description || "N/A"}</td>
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
        <div className={`m-a-modal-overlay ${darkMode ? "dark" : ""}`} onClick={() => setShowAddModal(false)}>
          <div className={`m-a-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`m-a-modal-title ${darkMode ? "dark" : ""}`}>Add Extra Income Record</h3>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Date</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Time</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Income Type</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="incomeType"
                value={formData.incomeType}
                onChange={handleInputChange}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Amount</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Description</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
              <div className="button-group">
                <button type="submit" className="me-submit-btn">Submit</button>
                <button type="button" className="me-cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className={`m-a-modal-overlay ${darkMode ? "dark" : ""}`} onClick={() => setEditingRecord(null)}>
          <div className={`m-a-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`m-a-modal-title ${darkMode ? "dark" : ""}`}>Edit Extra Income Record</h3>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Date</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="date"
                name="date"
                value={editingRecord.date}
                onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Time</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="time"
                name="time"
                value={editingRecord.time}
                onChange={(e) => setEditingRecord({ ...editingRecord, time: e.target.value })}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Income Type</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="incomeType"
                value={editingRecord.incomeType}
                onChange={(e) => setEditingRecord({ ...editingRecord, incomeType: e.target.value })}
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Amount</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="number"
                name="amount"
                value={editingRecord.amount}
                onChange={(e) => setEditingRecord({ ...editingRecord, amount: e.target.value })}
                min="0"
                step="0.01"
                required
              />
              <label className={`madd-label ${darkMode ? "dark" : ""}`}>Description</label>
              <input
                className={`madd-input ${darkMode ? "dark" : ""}`}
                type="text"
                name="description"
                value={editingRecord.description}
                onChange={(e) => setEditingRecord({ ...editingRecord, description: e.target.value })}
              />
              <div className="button-group">
                <button type="submit" className="me-submit-btn">Submit</button>
                <button type="button" className="me-cancel-btn" onClick={() => setEditingRecord(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div className="product-summary-modal-overlay">
          <div className={`product-summary-modal-content ${darkMode ? "dark" : ""}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Extra Income Summary</h3>
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
                  <h4>Total Extra Income</h4>
                  <p>{totalAmount.toFixed(2)}</p>
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

export default ExtraIncome;