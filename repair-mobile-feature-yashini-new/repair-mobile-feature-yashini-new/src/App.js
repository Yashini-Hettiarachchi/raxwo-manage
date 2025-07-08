import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ExtraIncome from './pages/ExtraIncome';
import Navbar from './Navbar';
import Home from './Home';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import SuperAdminSignup from './pages/SuperAdminSignup';
import SuperAdminLogin from './pages/SuperAdminLogin';
import AdminSignup from './pages/AdminSignup';
import AdminLogin from './pages/AdminLogin';
import CashierSignup from './pages/CashierSignup';
import CashierLogin from './pages/CashierLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserList from './pages/UserList';
import EditUser from './pages/EditUser';
import Payment from './pages/Payment';
import StockUpdate from './pages/StockUpdate';
import StockUpdateList from './StockUpdateList';
import Dashboard from './pages/Dashboard';
import SupplierList from './pages/SupplierList';
import SupplierUpdate from './pages/SupplierUpdate';
import './App.css';
import ReturnProductModal from './pages/ReturnProductModal';
import MaintenanceAdd from './pages/MaintenanceAdd';
import MaintenanceEdit from './pages/MaintenanceEdit';
import MaintenanceList from './pages/MaintenanceList';
import CashierList from './pages/CashierList';
import CashierAdd from './pages/CashierAdd';
import CashierEdit from './pages/CashierEdit';
import CashierAttendance from './pages/CashierAttendance';
import CashierAttendanceTable from './pages/CashierAttendanceTable';
import PaymentPaid from './pages/PaymentPaid';
import CustomerForm from './pages/CustomerForm';
import PaymentTable from './pages/PaymentTable';
import Header from './pages/Header';
import AddProductRepair from './AddProductRepair';
import EditProductRepair from './EditProductRepair';
import ProductRepairList from './ProductsRepair';
import ProductList from './ProductList';
import CartDetailsPage from './pages/CartDetailsPage';
import InputHandler from './InputHandler';
import SalaryList from './components/SalaryList';
import ShopSettings from './pages/ShopSettings';
import CustomerDetailsTable from './pages/CustomerDetailsTable';
import AllSummary from './pages/AllSummary';
import LogHistoryPage from './pages/LogHistoryPage';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/cashier/login" replace state={{ from: location }} />
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false); // Set light mode as default
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({
    id: localStorage.getItem('cashierId') || localStorage.getItem('userId') || 'N/A',
    name: localStorage.getItem('cashierName') || localStorage.getItem('username') || 'Unknown',
    role: localStorage.getItem('role') || 'N/A',
  });

  useEffect(() => {
    // Always use light mode, but keep dark mode colors for buttons
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    setUser({
      id: localStorage.getItem('cashierId') || localStorage.getItem('userId') || 'N/A',
      name: localStorage.getItem('cashierName') || localStorage.getItem('username') || 'Unknown',
      role: localStorage.getItem('role') || 'N/A',
    });
  }, []);

  const handleToggleSidebar = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} user={user} />
      <Navbar darkMode={darkMode} onToggleSidebar={handleToggleSidebar} />
      <div className={`content ${darkMode ? 'dark' : ''} ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/cashier/login" element={<CashierLogin darkMode={darkMode} />} />
          <Route path="/admin/login" element={<AdminLogin darkMode={darkMode} />} />
          <Route path="/cashier/signup" element={<CashierSignup darkMode={darkMode} />} />
          <Route path="/admin/signup" element={<AdminSignup darkMode={darkMode} />} />
          <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/AllSummary" element={<AllSummary darkMode={darkMode} />} />
          <Route
            path="/extra-income"
            element={
              <PrivateRoute>
                <ExtraIncome darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/add"
            element={
              <PrivateRoute>
                <AddProduct darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <PrivateRoute>
                <EditProduct darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UserList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <PrivateRoute>
                <UserList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-user/:id"
            element={
              <PrivateRoute>
                <EditUser darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <Payment darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/paymenPaid"
            element={
              <PrivateRoute>
                <PaymentPaid darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/CustomerForm"
            element={
              <PrivateRoute>
                <CustomerForm darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/stockUpdate"
            element={
              <PrivateRoute>
                <StockUpdate darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/stockUpdateList"
            element={
              <PrivateRoute>
                <StockUpdateList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-supplier/:id"
            element={
              <PrivateRoute>
                <SupplierUpdate darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/return/:id"
            element={
              <PrivateRoute>
                <ReturnProductModal darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <PrivateRoute>
                <MaintenanceAdd darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/maintenance-list"
            element={
              <PrivateRoute>
                <MaintenanceList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-maintenance/:id"
            element={
              <PrivateRoute>
                <MaintenanceEdit darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/cashiers"
            element={
              <PrivateRoute>
                <CashierList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/CashierAdd"
            element={
              <PrivateRoute>
                <CashierAdd darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-cashier/:id"
            element={
              <PrivateRoute>
                <CashierEdit darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/CashierAttendance"
            element={
              <PrivateRoute>
                <CashierAttendance darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/CashierAttendanceTable"
            element={
              <PrivateRoute>
                <CashierAttendanceTable darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/PaymentTable"
            element={
              <PrivateRoute>
                <PaymentTable darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/addRepair"
            element={
              <PrivateRoute>
                <AddProductRepair darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/productsRepair"
            element={
              <PrivateRoute>
                <ProductRepairList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-repair/:id"
            element={
              <PrivateRoute>
                <EditProductRepair darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <ProductList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/SupplierList"
            element={
              <PrivateRoute>
                <SupplierList darkMode={darkMode} closeModal={() => {}} />
              </PrivateRoute>
            }
          />
          <Route
            path="/salaries"
            element={
              <PrivateRoute>
                <SalaryList darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers/:supplierId/cart"
            element={
              <PrivateRoute>
                <CartDetailsPage darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/input-controls"
            element={
              <PrivateRoute>
                <InputHandler darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/ShopSettings"
            element={
              <PrivateRoute>
                <ShopSettings darkMode={darkMode} onClose={() => {}} />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer-details"
            element={
              <PrivateRoute>
                <CustomerDetailsTable darkMode={darkMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/log-history"
            element={
              <PrivateRoute>
                <LogHistoryPage darkMode={darkMode} />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;