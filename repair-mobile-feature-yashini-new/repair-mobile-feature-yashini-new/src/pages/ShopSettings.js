import React, { useState, useEffect } from 'react';
import '../styles/ShopSettings.css';

const ShopSettings = ({ darkMode, onClose }) => {
  const [shopDetails, setShopDetails] = useState({
    shopName: localStorage.getItem('shopName') || 'Default Shop',
    address: localStorage.getItem('shopAddress') || '123 Main St, City, Country',
    phone: localStorage.getItem('shopPhone') || '(123) 456-7890',
    logo: localStorage.getItem('shopLogo') || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShopDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setShopDetails((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('shopName', shopDetails.shopName);
    localStorage.setItem('shopAddress', shopDetails.address);
    localStorage.setItem('shopPhone', shopDetails.phone);
    localStorage.setItem('shopLogo', shopDetails.logo);
    alert('Shop details saved successfully!');
    onClose();
  };

  return (
    <div className="sh-popup">
      <div className={`sh-popup-content ${darkMode ? 'dark-mode' : ''}`}>
        <br/>
      <h2 className={`product-repair-list-title ${darkMode ? "dark" : ""}`}>
      Bill Settings</h2>
        <label className={`sh-p-lbl ${darkMode ? 'dark-mode' : ''}`}>Shop Name:</label>
        <input
          type="text"
          name="shopName"
          value={shopDetails.shopName}
          onChange={handleChange}
          className={darkMode ? 'dark-mode' : ''}
        />
        <label className={`sh-p-lbl ${darkMode ? 'dark-mode' : ''}`}>Address:</label>
        <input
          type="text"
          name="address"
          value={shopDetails.address}
          onChange={handleChange}
          className={darkMode ? 'dark-mode' : ''}
        />
        <label className={`sh-p-lbl ${darkMode ? 'dark-mode' : ''}`}>Phone Number:</label>
        <input
          type="text"
          name="phone"
          value={shopDetails.phone}
          onChange={handleChange}
          className={darkMode ? 'dark-mode' : ''}
        />
        <label className={`sh-p-lbl ${darkMode ? 'dark-mode' : ''}`}>Shop Logo:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className={darkMode ? 'dark-mode' : ''}
        />
        {shopDetails.logo && (
          <div style={{ marginTop: '10px' }}>
            <img src={shopDetails.logo} alt="Shop Logo Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
          </div>
        )}
        <div className="button-group">
          <button
            className={`p-con-btn ${darkMode ? 'dark-mode' : ''}`}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopSettings;