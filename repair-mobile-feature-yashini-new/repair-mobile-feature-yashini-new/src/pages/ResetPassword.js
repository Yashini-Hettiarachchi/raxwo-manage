import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5002/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.msg || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/cashier/login');
      }, 3000); // Redirect to login after 3 seconds
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password.');
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-wrapper">
        <h2 className="title">Reset Password</h2>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}
        <form onSubmit={handleSubmit} className="reset-password-form">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">Reset Password</button>
        </form>
        <p className="back-to-login">
          <Link to="/cashier/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;