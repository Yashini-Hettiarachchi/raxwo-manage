import React, { useState, useEffect } from 'react';
import '../styles/Users.css';
import EditUser from './EditUser';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import edticon from "../icon/edit.png";
import deleteicon from "../icon/delete.png";
import usericon from '../icon/employee.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFile, faFilePdf, faFileExcel, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://localhost:5002/api/auth/users';

const UserList = ({ darkMode }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete user: ${response.statusText}`);
      setUsers(users.filter(user => user._id !== id));
      setShowActionMenu(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setShowActionMenu(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('User List', 90, 20);

    const tableData = users.map(user => [user.username, user.email, user.phone, user.role]);
    doc.autoTable({
      head: [['Username', 'Email', 'Phone', 'Role']],
      body: tableData,
      startY: 30,
    });

    doc.save('user_list.pdf');
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(users.map(user => ({
      'Username': user.username,
      'Email': user.email,
      'Phone': user.phone,
      'Role': user.role,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_list.xlsx");
    setShowReportOptions(false);
  };

  const filteredUsers = users.filter(user =>
    Object.values(user).some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={`product-repair-list-container ${darkMode ? "dark" : ""}`}>
      
      <div className="header-section">
        

        <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
        USER LIST
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`product-list-search-bar ${darkMode ? 'dark' : ''}`}
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        
        <button onClick={() => setShowReportOptions(true)} className={`btn-report ${darkMode ? 'dark' : ''}`}>
          <FontAwesomeIcon icon={faFile} />&nbsp; Reports
        </button>
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
        <p className="loading">Loading users...</p>
      ) : !users || filteredUsers.length === 0 ? (
        <p className="no-products">No users found.</p>
      ) : (
        <table className={`product-table ${darkMode ? 'dark' : ''}`}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.role}</td>
                <td>
                  <div className="action-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowActionMenu(showActionMenu === user._id ? null : user._id);
                      }}
                      className="action-dot-btn"
                    >
                      ⋮
                    </button>
                    {showActionMenu === user._id && (
                      <div className="action-menu"
                      onMouseLeave={() => setShowActionMenu(null)}>
                        <button onClick={() => handleEdit(user)} className="p-edit-btn">
                          <div className="action-btn-content">
                            <img src={edticon} alt="edit" width="30" height="30" className="p-edit-btn-icon" />
                            <span>Edit</span>
                          </div>
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-delete-btn">
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
      {showModal && (
        <EditUser
          user={selectedUser}
          closeModal={() => {
            setShowModal(false);
            fetchUsers();
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default UserList;