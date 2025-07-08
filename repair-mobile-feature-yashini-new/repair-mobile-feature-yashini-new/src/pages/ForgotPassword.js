import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/ForgotPassword.css';

const ForgotPassword = ({darkMode}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://localhost:5002/api/auth/forgot-password', { email });
      setMessage(res.data.msg || 'Password reset email sent!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset email.');
    }
  };

  return (
    <div className={`forgot-password-container ${darkMode ? "dark" : ""}`}>
      <div className={`forgot-password-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className="f-p-title">Forgot Password</h2>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}
        <form onSubmit={handleSubmit} className={`forgot-password-form ${darkMode ? "dark" : ""}`}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">Send Reset Link</button>
        </form>
        <p className={`back-to-login ${darkMode ? "dark" : ""}`}>
          Remember your password? <Link to="/cashier/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;