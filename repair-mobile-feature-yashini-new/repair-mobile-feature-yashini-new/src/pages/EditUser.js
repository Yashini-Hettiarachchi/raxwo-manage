import React, { useState } from 'react';
import '../styles/EditUser.css';

const API_URL = 'http://localhost:5002/api/auth/users';

const EditUser = ({ user, closeModal,darkMode }) => {
  const [formData, setFormData] = useState(user);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Failed to update user: ${response.statusText}`);

      setSuccess('User updated successfully!');
      setTimeout(() => closeModal(), 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`modal-overlay ${darkMode ? "dark" : "light"}`}>
      <div className={`user-edi-modal-container ${darkMode ? "dark" : "light"}`}>
        <h2 className={`ue-modal-title ${darkMode ? "dark" : ""}`}>Edit User</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className={`ue-input-group ${darkMode ? "dark" : "light"}`}>
            <label htmlFor="username">USERNAME</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
          </div>

          <div className={`ue-input-group ${darkMode ? "dark" : "light"}`}>
            <label htmlFor="email">EMAIL</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={`ue-input-group ${darkMode ? "dark" : "light"}`}>
            <label htmlFor="phone">PHONE</label>
            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className={`ue-input-group ${darkMode ? "dark" : "light"}`}>
            <label htmlFor="role">ROLE</label>
            <select id="role" name="role" className={`ue-drop ${darkMode ? "dark" : "light"}`} value={formData.role} onChange={handleChange} required>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="button-group">
            <button type="submit" className="eu-save-btn">Save</button>
            <button type="button" className="eu-cancel-btn" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
