import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import usericon from '../icon/businessman.png';

const Header = ({ darkMode, setDarkMode }) => {
  const [showUserCard, setShowUserCard] = useState(false);
  const [user, setUser] = useState({
    id: localStorage.getItem('userId') || 'N/A',
    name: localStorage.getItem('username') || 'Unknown',
    role: localStorage.getItem('role') || 'Unknown',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      setUser({
        id: localStorage.getItem('userId') || 'N/A',
        name: localStorage.getItem('username') || 'Unknown',
        role: localStorage.getItem('role') || 'Unknown',
      });
    };
    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  const toggleUserCard = () => {
    setShowUserCard(!showUserCard);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser({ id: 'N/A', name: 'Unknown', role: 'Unknown' });
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="header-container">
      <button className="not-icon-btn" aria-label="Notifications" style={{ backgroundColor: 'black' }}>
        <span className="inot-con">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
              fill="white"
            />
          </svg>
        </span>
      </button>

      <button className="refresh-btn" onClick={handleRefresh} aria-label="Refresh Page" style={{ backgroundColor: 'black' }}>
        <span className="refresh-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
              fill="white"
            />
          </svg>
        </span>
      </button>

      <button
        className="icon-btn"
        onClick={toggleUserCard}
        aria-label="User Profile"
        style={{ backgroundColor: 'black' }}
      >
        <span className="user-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
              fill="white"
            />
          </svg>
        </span>
      </button>

      {showUserCard && (
        <div className={`h-user-card ${darkMode ? 'dark' : ''}`}>
          <div className="user-card-header">
            <div className="user-avatar">
              <img src={usericon} alt="remove" width="45" height="45" />
            </div>
            <div className="user-info">
              <h4 className="user-name">{user.name}</h4>
              <p className="user-role">{user.role}</p>
            </div>
          </div>
          <div className="user-card-body">
            <p className="user-detail"><strong>ID:</strong> {user.id}</p>
          </div>
          <div className="user-card-footer">
            <button
              className={`logout-btn ${darkMode ? 'dark' : ''}`}
              onClick={handleLogout}
            >
              Logout
            </button>
            <button
              className={`close-btn ${darkMode ? 'dark' : ''}`}
              onClick={toggleUserCard}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;