import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminSignup.css";
import signupImage from "../images/blue3.png"; // Adjust the path to your image

const API_URL = "http://localhost:5002/api/auth/register";

const AdminSignup = ({darkMode}) => {
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
          role: "admin"
        })
      });

      if (!response.ok) throw new Error("Registration failed.");

      setMessage("✅ Admin registered successfully!");
      setTimeout(() => navigate("/admin/login"), 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`a-signup-container ${darkMode ? "dark" : ""}`}>
      <div className={`a-signup-form-wrapper ${darkMode ? "dark" : ""}`}>
        <h2 className={`a-signup-title ${darkMode ? "dark" : ""}`}>🛡️ Admin Signup</h2>

        {loading && <p className="loading">Registering admin...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className={`a-signup-label ${darkMode ? "dark" : ""}`}>USER NAME:</label>
          <input className={`a-signup-input ${darkMode ? "dark" : ""}`} type="text" name="username" value={formData.username} onChange={handleChange} required />

          <label className={`a-signup-label ${darkMode ? "dark" : ""}`}>EMAIL:</label>
          <input className={`a-signup-input ${darkMode ? "dark" : ""}`} type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label className={`a-signup-label ${darkMode ? "dark" : ""}`}>PHONE:</label>
          <input className={`a-signup-input ${darkMode ? "dark" : ""}`} type="text" name="phone" value={formData.phone} onChange={handleChange} required />

          <label className={`a-signup-label ${darkMode ? "dark" : ""}`}>PASSWORD:</label>
          <input className={`a-signup-input ${darkMode ? "dark" : ""}`} type="password" name="password" value={formData.password} onChange={handleChange} required />

          <label className={`a-signup-label ${darkMode ? "dark" : ""}`}>CONFIRM PASSWORD:</label>
          <input className={`a-signup-input ${darkMode ? "dark" : ""}`} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />

          <div className="button-group">
            <button type="submit" className="a-submit-btn" disabled={loading}>
              {loading ? "Registering..." : "Sign Up as Admin"}
            </button>
            <button type="button" className="a-cancel-btn" onClick={() => navigate("/")}>Cancel</button>
          </div>
        </form>
      </div>
      <div className="signup-image-wrapper">
        <img src={signupImage} className="signup-image" alt="company-logo" />
      </div>
    </div>
  );
};

export default AdminSignup;