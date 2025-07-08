import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/SuperAdminLogin.css';
import loginImage from '../images/blue3.png';

const SuperAdminLogin = ({ darkMode }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post('http://localhost:5002/api/auth/login', formData);
      console.log('SuperAdmin login successful:', res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('username', res.data.user.username);
      localStorage.setItem('role', res.data.user.role);
      setMessage('✅ Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      console.error(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`s-login-container ${darkMode ? "dark" : ""}`}>
      <div className={`s-form-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className={`s-title ${darkMode ? "dark" : ""}`}>🔐 Super Admin Login</h2>
        {loading && <p className="loading">Processing...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label className={`s-label ${darkMode ? "dark" : ""}`}>EMAIL:</label>
          <input className={`s-input ${darkMode ? "dark" : ""}`} type="email" name="email" value={formData.email} onChange={handleChange} required />
          <label className={`s-label ${darkMode ? "dark" : ""}`}>PASSWORD:</label>
          <input className={`s-input ${darkMode ? "dark" : ""}`} type="password" name="password" value={formData.password} onChange={handleChange} required />
          <div className='button-group'>
            <button type="submit" className="s-l-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button type="button" className="s-l-cancel-btn" onClick={() => navigate("/")}>Cancel</button>
          </div>
        </form>
        <p className="forgot-password-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
      {/* <div className="login-image-wrapper">
        <img src={loginImage} className="login-image" alt="company-logo" />
      </div> */}
    </div>
  );
};

export default SuperAdminLogin;