import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CartDetailsTable from './CartDetailsTable';
import '../styles/Supplier.css';

const CartDetailsPage = ({ darkMode }) => {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const refreshSuppliers = () => {
    navigate('/products');
  };

  return (
    <div className={`product-list-container ${darkMode ? 'dark' : ''}`}>
      <div className="header-section">
        <h2 className={`product-list-title ${darkMode ? 'dark' : ''}`}>
          SUPPLIER CART DETAILS
        </h2>
        
      </div>
      <CartDetailsTable
        supplierId={supplierId}
        darkMode={darkMode}
        refreshSuppliers={refreshSuppliers}
      />
    </div>
  );
};

export default CartDetailsPage;