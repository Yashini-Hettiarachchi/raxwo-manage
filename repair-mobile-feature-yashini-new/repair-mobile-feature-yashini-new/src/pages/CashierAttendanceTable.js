import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "../styles/CashierAttendanceTable.css";
import editicon from "../icon/edit.png";
import deleteicon from "../icon/delete.png";
import attendlisticon from "../icon/marking.png";

const API_URL = "http://localhost:5002/api/attendance";

const CashierAttendanceTable = ({ darkMode }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [updatedAttendance, setUpdatedAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long", year: "numeric" }));
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setAttendanceData(res.data);
      setLoading(false);
    } catch (error) {
      setError("Error fetching attendance records");
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setUpdatedAttendance({ ...record });
    setShowActionMenu(null);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/${editingRecord._id}`, updatedAttendance);
      fetchAttendance();
      setEditingRecord(null);
    } catch (error) {
      setError("Error updating attendance");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchAttendance();
        setShowActionMenu(null);
      } catch (error) {
        setError("Error deleting attendance record");
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Cashier Attendance Records", 20, 10);
    let y = 20;
    filteredData.forEach((record, index) => {
      doc.text(
        `${index + 1}. ${record.cashierName} - ${record.date} - In: ${record.inTime || "-"} - Out: ${record.outTime || "-"}`,
        10,
        y
      );
      y += 10;
    });
    doc.save("CashierAttendance.pdf");
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const formattedData = filteredData.map((record, index) => ({
      No: index + 1,
      CashierID: record.cashierId,
      Name: record.cashierName,
      JobRole: record.jobRole,
      Month: record.month,
      Date: record.date,
      InTime: record.inTime || "-",
      OutTime: record.outTime || "-",
      Remarks: record.remarks || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records");
    XLSX.writeFile(workbook, "CashierAttendance.xlsx");
    setShowReportOptions(false);
  };

  const filteredData = attendanceData.filter(
    (record) =>
      (record.cashierId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.cashierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.jobRole || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.date || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.month || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.inTime || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.outTime || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.remarks || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDailyAttendance = () => {
    const daysInMonth = new Date(
      new Date(selectedMonth).getFullYear(),
      new Date(selectedMonth).getMonth() + 1,
      0
    ).getDate();
    const dailyCounts = Array(daysInMonth).fill(0);

    attendanceData.forEach((record) => {
      const recordDate = new Date(record.date);
      const recordMonthYear = recordDate.toLocaleString("default", { month: "long", year: "numeric" });
      if (recordMonthYear === selectedMonth) {
        const day = recordDate.getDate() - 1;
        dailyCounts[day] += 1;
      }
    });

    return {
      categories: Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
      data: dailyCounts,
    };
  };

  const calculateMonthlyAttendance = () => {
    const today = new Date();
    const months = [];
    const monthlyCounts = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i);
      const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
      months.push(monthYear);

      const count = attendanceData.filter((record) => {
        const recordDate = new Date(record.date);
        const recordMonthYear = recordDate.toLocaleString("default", { month: "long", year: "numeric" });
        return recordMonthYear === monthYear;
      }).length;

      monthlyCounts.push(count);
    }

    return { categories: months, data: monthlyCounts };
  };

  const dailyAttendance = calculateDailyAttendance();
  const monthlyAttendance = calculateMonthlyAttendance();

  const uniqueMonths = [...new Set(attendanceData.map((record) => {
    const date = new Date(record.date);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }))].sort((a, b) => new Date(b) - new Date(a));

  const dailyChartOptions = {
    chart: {
      type: "line",
      backgroundColor: darkMode ? "rgba(251, 251, 251, 0.1)" : "whitesmoke",
      borderWidth: 0,
    },
    title: {
      text: `Daily Attendance for ${selectedMonth}`,
      style: { color: darkMode ? "#ffffff" : "#000000", fontFamily: "'Inter', sans-serif", fontSize: "18px" },
    },
    xAxis: {
      categories: dailyAttendance.categories,
      title: { text: "Day of Month", style: { color: darkMode ? "#ffffff" : "#000000" } },
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
      title: { text: "Number of Records", style: { color: darkMode ? "#ffffff" : "#000000" } },
      labels: {
        style: {
          color: darkMode ? "#ffffff" : "#000000",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
        },
      },
      gridLineColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(82, 82, 82, 0.2)",
      lineWidth: 1,
      min: 0,
    },
    series: [
      {
        name: "Attendance Records",
        data: dailyAttendance.data,
        color: "#1e90ff",
      },
    ],
    legend: {
      enabled: false,
    },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(245, 245, 245, 0.9)",
      style: {
        color: darkMode ? "#ffffff" : "#000000",
        fontFamily: "'Inter', sans-serif",
      },
      formatter: function () {
        return `<b>Day ${this.x}</b>: ${this.y} records`;
      },
    },
  };

  const monthlyChartOptions = {
    chart: {
      type: "line",
      backgroundColor: darkMode ? "rgba(251, 251, 251, 0.1)" : "whitesmoke",
      borderWidth: 0,
    },
    title: {
      text: "Monthly Attendance (Last 6 Months)",
      style: { color: darkMode ? "#ffffff" : "#000000", fontFamily: "'Inter', sans-serif", fontSize: "18px" },
    },
    xAxis: {
      categories: monthlyAttendance.categories,
      title: { text: "Month", style: { color: darkMode ? "#ffffff" : "#000000" } },
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
      title: { text: "Number of Records", style: { color: darkMode ? "#ffffff" : "#000000" } },
      labels: {
        style: {
          color: darkMode ? "#ffffff" : "#000000",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
        },
      },
      gridLineColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      lineColor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(82, 82, 82, 0.2)",
      lineWidth: 1,
      min: 0,
    },
    series: [
      {
        name: "Attendance Records",
        data: monthlyAttendance.data,
        color: "#ff4040",
      },
    ],
    legend: {
      enabled: false,
    },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(245, 245, 245, 0.9)",
      style: {
        color: darkMode ? "#ffffff" : "#000000",
        fontFamily: "'Inter', sans-serif",
      },
      formatter: function () {
        return `<b>${this.x}</b>: ${this.y} records`;
      },
    },
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
        CASHIER ATTENDANCE RECORDS
        </h2>
      </div>

      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Attendance..."
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

        <button onClick={() => setSummaryModalOpen(true)} className="btn-summary">
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
        <p className="loading">Loading attendance records...</p>
      ) : filteredData.length === 0 ? (
        <p className="no-products">No attendance records available.</p>
      ) : (
        <table className={`product-table ${darkMode ? "dark" : ""}`}>
          <thead>
            <tr>
              <th>Cashier ID</th>
              <th>Name</th>
              <th>Job Role</th>
              <th>Month</th>
              <th>Date</th>
              <th>In-Time</th>
              <th>Out-Time</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((record) => (
              <tr key={record._id}>
                <td>{record.cashierId}</td>
                <td>{record.cashierName}</td>
                <td>{record.jobRole}</td>
                <td>{record.month}</td>
                <td>{record.date}</td>
                <td>{record.inTime || "-"}</td>
                <td>{record.outTime || "-"}</td>
                <td>{record.remarks || "-"}</td>
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
                        <button onClick={() => handleEditClick(record)} className="p-edit-btn">
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
      {editingRecord && (
        <div className="c-att-modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className={`c-att-modal-container ${darkMode ? "dark" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="c-att-modal-header">
              <h3 className="c-att-modal-title">Edit Attendance</h3>
              <button onClick={() => setEditingRecord(null)} className="c-att-modal-close-icon">
                ✕
              </button>
            </div>
            <div className="c-att-modal-content">
              <label className="attend-lbl">Out-Time:</label>
              <input
                type="text"
                value={updatedAttendance.outTime || ""}
                onChange={(e) => setUpdatedAttendance({ ...updatedAttendance, outTime: e.target.value })}
                className={`c-att-modal-input ${darkMode ? "dark" : ""}`}
              />
              <label className="attend-lbl">Remarks:</label>
              <input
                type="text"
                value={updatedAttendance.remarks || ""}
                onChange={(e) => setUpdatedAttendance({ ...updatedAttendance, remarks: e.target.value })}
                className={`modal-input ${darkMode ? "dark" : ""}`}
              />
            </div>
            <div className="modal-footer">
              <button onClick={handleUpdate} className="modal-save-btn">Update</button>
              <button onClick={() => setEditingRecord(null)} className="modal-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {summaryModalOpen && (
        <div className="att-product-summary-modal-overlay">
          <div className={`att-product-summary-modal-content ${darkMode ? "dark" : ""}`}>
            <div className="product-summary-modal-header">
              <h3 className="product-summary-modal-title">Attendance Summary</h3>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="product-summary-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="product-summary-content">
              <div className="attendance-summary-month-selector">
                <label>Select Month: </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`month-selector ${darkMode ? "dark" : ""}`}
                >
                  {uniqueMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="product-summary-chart-container">
                <HighchartsReact highcharts={Highcharts} options={dailyChartOptions} />
              </div>
              <div className="product-summary-chart-container">
                <HighchartsReact highcharts={Highcharts} options={monthlyChartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierAttendanceTable;