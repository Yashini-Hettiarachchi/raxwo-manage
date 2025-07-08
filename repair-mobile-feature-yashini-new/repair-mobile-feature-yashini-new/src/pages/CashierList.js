import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import '../styles/CashierList.css';
import editicon from '../icon/edit.png';
import deleteicon from '../icon/delete.png';
import cashiericon from '../icon/people.png';
import CashierAdd from "./CashierAdd";
import CashierEdit from "./CashierEdit";

const API_URL = "http://localhost:5002/api/cashiers";

const CashierList = ({ darkMode }) => {
  const [cashiers, setCashiers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setCashiers(res.data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching cashiers");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this cashier?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setCashiers(cashiers.filter((cashier) => cashier._id !== id));
        setShowActionMenu(null);
      } catch (err) {
        setError("Error deleting cashier");
      }
    }
  };

  const handleEditClick = (cashier) => {
    setSelectedCashier(cashier);
    setEditModalOpen(true);
    setShowActionMenu(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Cashier List", 90, 20);

    const tableData = filteredCashiers.map((cashier) => [
      cashier.id,
      cashier.jobRole,
      cashier.cashierName,
      cashier.phone,
      cashier.nic,
      cashier.email,
      cashier.remarks || 'N/A',
    ]);

    doc.autoTable({
      head: [["ID", "Job Role", "Name", "Phone", "NIC", "Email", "Remarks"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10 },
      theme: "striped",
    });

    doc.save("cashier_list.pdf");
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const formattedCashiers = filteredCashiers.map((cashier) => ({
      ID: cashier.id,
      "Job Role": cashier.jobRole,
      Name: cashier.cashierName,
      Phone: cashier.phone,
      NIC: cashier.nic,
      Email: cashier.email,
      Remarks: cashier.remarks || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedCashiers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cashiers");
    XLSX.writeFile(workbook, "cashier_list.xlsx");
    setShowReportOptions(false);
  };

  const filteredCashiers = cashiers.filter((cashier) =>
    (cashier.cashierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.nic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.jobRole || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cashier.remarks || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
        EMPLOYEE LIST
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Cashiers..."
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

        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} /> Add Cashier or Employee

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
        <p className="loading">Loading cashiers...</p>
      ) : filteredCashiers.length === 0 ? (
        <p className="no-products">No cashiers available.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Role</th>
              <th>Name</th>
              <th>Phone</th>
              <th>NIC</th>
              <th>Email</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCashiers.map((cashier) => (
              <tr key={cashier._id}>
                <td>{cashier.id}</td>
                <td>{cashier.jobRole}</td>
                <td>{cashier.cashierName}</td>
                <td>{cashier.phone}</td>
                <td>{cashier.nic}</td>
                <td>{cashier.email}</td>
                <td>{cashier.remarks || 'N/A'}</td>
                <td>
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === cashier._id ? null : cashier._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === cashier._id && (
                      <div className="action-menu" onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleEditClick(cashier)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={editicon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(cashier._id)} className="p-delete-btn">
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
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <CashierAdd
              isOpen={isAddModalOpen}
              onClose={() => setAddModalOpen(false)}
              refreshCashiers={fetchCashiers}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
      {isEditModalOpen && selectedCashier && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <CashierEdit
              isOpen={isEditModalOpen}
              onClose={() => setEditModalOpen(false)}
              cashier={selectedCashier}
              refreshCashiers={fetchCashiers}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierList;