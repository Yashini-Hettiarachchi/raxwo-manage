import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SuperAdminSignup.css";
import signupImage from "../images/blue3.png"; // Adjust the path to your image

const API_URL = "http://localhost:5002/api/auth/register";

const SuperAdminSignup = ({darkMode}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "superadmin"
        })
      });

      if (!response.ok) throw new Error("Registration failed.");

      setMessage("✅ Super Admin registered successfully!");
      setTimeout(() => navigate("/superadmin/login"), 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`s-signup-container ${darkMode ? "dark" : ""}`}>
      <div className={`s-signup-form-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className={`s-signup-title ${darkMode ? "dark" : ""}`}>👑 Super Admin Signup</h2>

        {loading && <p className="loading">Registering super admin...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className={`s-signup-label ${darkMode ? "dark" : ""}`}>USER NAME:</label>
          <input className={`s-signup-input ${darkMode ? "dark" : ""}`} type="text" name="username" value={formData.username} onChange={handleChange} required />

          <label className={`s-signup-label ${darkMode ? "dark" : ""}`}>EMAIL:</label>
          <input className={`s-signup-input ${darkMode ? "dark" : ""}`} type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label className={`s-signup-label ${darkMode ? "dark" : ""}`}>PHONE:</label>
          <input className={`s-signup-input ${darkMode ? "dark" : ""}`} type="text" name="phone" value={formData.phone} onChange={handleChange} required />

          <label className={`s-signup-label ${darkMode ? "dark" : ""}`}>PASSWORD:</label>
          <input className={`s-signup-input ${darkMode ? "dark" : ""}`} type="password" name="password" value={formData.password} onChange={handleChange} required />

          <label className={`s-signup-label ${darkMode ? "dark" : ""}`}>CONFIRM PASSWORD:</label>
          <input className={`s-signup-input ${darkMode ? "dark" : ""}`} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />

          <div className="button-group">
            <button type="submit" className="s-submit-btn" disabled={loading}>
              {loading ? "Registering..." : "Sign Up as Super Admin"}
            </button>
            <button type="button" className="s-cancel-btn" onClick={() => navigate("/")}>Cancel</button>
          </div>
        </form>
      </div>
      <div className="signup-image-wrapper">
        <img src={signupImage} className="signup-image" alt="company-logo" />
      </div>
    </div>
  );
};

export default SuperAdminSignup;