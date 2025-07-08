import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import signupImage from '../images/blue3.png';
import '../styles/CashierSignup.css';

const UserSignup = ({ darkMode }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'cashier' // Default role
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5002/api/auth/register', {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      setMessage(`✅ ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} registration successful!`);
      setTimeout(() => navigate('/cashier/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`u-signup-container ${darkMode ? "dark" : ""}`}>
      <div className={`u-signup-form-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className={`u-signup-title ${darkMode ? "dark" : ""}`}>🛍️ User Signup</h2>
        {loading && <p className="loading">Processing...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Username:</label>
            <input
              id="username"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Email:</label>
            <input
              id="email"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Phone:</label>
            <input
              id="phone"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="role" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Role:</label>
            <select
              id="role"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="cashier" className='drop'>Cashier</option>
              <option value="admin" className='drop'>Admin</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="password" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Password:</label>
            <input
              id="password"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword" className={`u-signup-label ${darkMode ? "dark" : ""}`}>Confirm Password:</label>
            <input
              id="confirmPassword"
              className={`u-signup-input ${darkMode ? "dark" : ""}`}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="u-submit-btn" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
            <button type="button" className="close-btn" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      {/* <div className="usersignup-image-wrapper">
        <img src={signupImage} className="usersignup-image" alt="company-logo" />
      </div> */}
    </div>
  );
};

export default UserSignup;