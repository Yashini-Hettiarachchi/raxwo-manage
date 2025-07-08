import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/CashierLogin.css";
import loginImage from '../images/blue3.png';

const UserLogin = ({ darkMode }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axios.post("http://localhost:5002/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      console.log('Login response:', res.data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("username", res.data.user.username);
      localStorage.setItem("role", res.data.user.role);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        if (res.data.user.role === 'admin') {
          navigate("/dashboard");
        } else {
          navigate("/payment");
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`u-login-container ${darkMode ? "dark" : ""}`}>
      <div className={`u-l-form-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className={`u-l-title ${darkMode ? "dark" : ""}`}>🔐 User Login</h2>
        {loading && <p className="loading">Processing...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label className={`u-l-label ${darkMode ? "dark" : ""}`}>Email:</label>
          <input
            className={`u-l-input ${darkMode ? "dark" : ""}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label className={`u-l-label ${darkMode ? "dark" : ""}`}>Password:</label>
          <input
            className={`u-l-input ${darkMode ? "dark" : ""}`}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <div className="button-group">
            <button type="submit" className="u-l-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button type="button" className="close-btn" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
        <p className="forgot-password-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className={`register-link ${darkMode ? "dark" : ""}`}>
          Don't have an account? <Link to="/cashier/signup">Sign up</Link>
        </p>
      </div>
      {/* <div className="login-image-wrapper">
        <img src={loginImage} className="login-image" alt="company-logo" />
      </div> */}
    </div>
  );
};

export default UserLogin;