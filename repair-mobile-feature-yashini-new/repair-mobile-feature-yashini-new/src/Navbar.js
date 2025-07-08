import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBox,
  FaFileAlt,
  FaCog,
  FaUser,
  FaPen,
  FaCashRegister,
  FaMarker,
  FaTable,
  FaDatabase,
  FaUserFriends,
  FaWrench,
  FaMoneyBillWaveAlt,
  FaAngleLeft,
  FaAngleRight,
  FaAngrycreative,
  FaChartBar,
  FaHistory,
} from "react-icons/fa";
import "./Navbar.css";
import gelogo from './icon/Ge.logo.jpg';

const Navbar = ({ darkMode, onToggleSidebar }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    onToggleSidebar?.(!isCollapsed);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button className="mobile-menu-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        ☰
      </button>

      {/* Overlay for mobile sidebar */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      <div className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "open" : ""}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {/* No text or icon, arrow shape is handled by CSS */}
        </button>

        <div className="sidebar-logo">
          <img src={gelogo} alt="logo" className="logo" />
        </div>

        <ul className="sidebar-menu">
          <li><NavLink to="/Dashboard" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaTachometerAlt className="icon" /><span>Dashboard</span></NavLink></li>
          <li><NavLink to="/productsRepair" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaWrench className="icon" /><span>Repair Jobs</span></NavLink></li>
          <li><NavLink to="/products" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaBox className="icon" /><span>Products</span></NavLink></li>
          <li><NavLink to="/StockUpdateList" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaPen className="icon" /><span>Stock Management</span></NavLink></li>
          <li><NavLink to="/SupplierList" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaUserFriends className="icon" /><span>Suppliers</span></NavLink></li>
          <li><NavLink to="/cashiers" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaCashRegister className="icon" /><span>Staff</span></NavLink></li>
          <li><NavLink to="/Users" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaUser className="icon" /><span>User Accounts</span></NavLink></li>
          <li><NavLink to="/salaries" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaMoneyBillWaveAlt className="icon" /><span>Payroll</span></NavLink></li>
          <li><NavLink to="/payment" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaFileAlt className="icon" /><span>New Payment</span></NavLink></li>
          <li><NavLink to="/PaymentTable" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaDatabase className="icon" /><span>Payment Records</span></NavLink></li>
          <li><NavLink to="/extra-income" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaMoneyBillWaveAlt className="icon" /><span>Other Income</span></NavLink></li>
          <li><NavLink to="/maintenance-list" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaCog className="icon" /><span>Maintenance</span></NavLink></li>
          <li><NavLink to="/CashierAttendance" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaMarker className="icon" /><span>Attendance</span></NavLink></li>
          <li><NavLink to="/CashierAttendanceTable" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaTable className="icon" /><span>Attendance Records</span></NavLink></li>
          <li><NavLink to="/ShopSettings" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaAngrycreative className="icon" /><span>Billing Settings</span></NavLink></li>
          <li><NavLink to="/AllSummary" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaChartBar className="icon" /><span>Summary Reports</span></NavLink></li>
          <li><NavLink to="/log-history" className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"} onClick={() => isMobileOpen && setIsMobileOpen(false)}><FaHistory className="icon" /><span>Activity Log</span></NavLink></li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
