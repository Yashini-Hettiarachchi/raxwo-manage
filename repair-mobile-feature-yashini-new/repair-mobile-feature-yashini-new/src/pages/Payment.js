import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Payment.css';
import remicon from '../icon/info.png';
import caicon from '../icon/businessman.png';
import PaymentPaid from './PaymentPaid';
import CustomerForm from './CustomerForm';
import ReturnPayment from './ReturnPayment';
import ShopSettings from './ShopSettings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCartPlus } from '@fortawesome/free-solid-svg-icons';

const Payment = ({ darkMode }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartSearchQuery, setCartSearchQuery] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showReturnPopup, setShowReturnPopup] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [latestInvoiceNumber, setLatestInvoiceNumber] = useState(null);
  const [showCashierCard, setShowCashierCard] = useState(false);
  const [error, setError] = useState(null);
  const [isWholesale, setIsWholesale] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  // New state for customer details
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  const [cashierId, setCashierId] = useState(localStorage.getItem('userId') || 'N/A');
  const [cashierName, setCashierName] = useState(localStorage.getItem('username') || 'Unknown');

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Payment useEffect - Token:', token);
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/');
      return;
    }

    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('username');
    setCashierId(id || 'N/A');
    setCashierName(name || 'Unknown');

    axios.get('http://localhost:5002/api/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        console.log('Products fetched:', res.data);
        setProducts(res.data);
      })
      .catch(err => {
        console.error('Error fetching products:', err.response?.data);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          navigate('/');
        }
        setError('Failed to load products. Please try logging in again.');
      });
  }, [navigate]);

  const addToCart = (product) => {
    setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, value) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity = Math.max(1, Number(value));
    setCart(updatedCart);
  };

  const applyDiscount = (index, discount) => {
    const updatedCart = [...cart];
    updatedCart[index].discount = Math.max(0, Number(discount));
    setCart(updatedCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((total, item) => total + item.discount, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount();
  };

  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = products.filter((product) =>
    product.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.buyingPrice.toString().includes(searchQuery) ||
    product.sellingPrice.toString().includes(searchQuery)
  );

  const filteredCart = cart.filter((item) =>
    item.itemName.toLowerCase().includes(cartSearchQuery.toLowerCase())
  );

  const handlePaymentClose = (invoiceNumber) => {
    setShowPopup(false);
    if (invoiceNumber) {
      setLatestInvoiceNumber(invoiceNumber);
      setCart([]);
      // Clear customer details after payment
      setCustomerName('');
      setContactNumber('');
      setAddress('');
      // Clear wholesale customer details after payment
      localStorage.removeItem('wholesaleCustomer');
      setIsWholesale(false);
      setCustomerDetails(null);
    }
  };

  const handleReturnClose = (returnInvoiceNumber) => {
    setShowReturnPopup(false);
    if (returnInvoiceNumber) {
      setLatestInvoiceNumber(returnInvoiceNumber);
    }
  };

  const handleCustomerSubmit = ({ isWholesale, customerDetails }) => {
    setIsWholesale(isWholesale);
    setCustomerDetails(customerDetails);
  };

  const toggleCashierCard = () => {
    setShowCashierCard(!showCashierCard);
  };

  const [isCartSearchVisible, setIsCartSearchVisible] = useState(false);

  return (
    <div className={`payment-container ${darkMode ? 'dark' : ''}`}>
      {error && <p className="error-message">{error}</p>}
      <br/><br/>
      <br/><br/>

      <div className={`cart ${darkMode ? 'dark' : ''}`}>
        <div className="cart-header">
          <h2 className={`salary-list-title ${darkMode ? 'dark' : ''}`}>CART</h2>
          
          <div className="cart-search-container">

            <button
              className={`add-btn ${darkMode ? 'dark' : ''}`}
              onClick={() => setIsCartSearchVisible(!isCartSearchVisible)}
            >
              <FontAwesomeIcon icon={faSearch} size="lg" className={`cart-ser-icon ${darkMode ? 'dark' : ''}`}/>
            </button>
            {isCartSearchVisible && (
              <input
                type="text"
                placeholder=" Search in cart..."
                value={cartSearchQuery}
                onChange={(e) => setCartSearchQuery(e.target.value)}
                className={`cart-search ${darkMode ? 'dark' : ''}`}
              />
            )}
            <button
              className={`return-payment-btn ${darkMode ? 'dark' : ''}`}
              onClick={() => setShowReturnPopup(true)}
            >
              Return Payment
            </button>
          </div>
        </div>
        {/* Customer Details Input Fields */}
        <div className="customer-details-input">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={`customer-input ${darkMode ? 'dark' : ''}`}
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className={`customer-input ${darkMode ? 'dark' : ''}`}
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`customer-input ${darkMode ? 'dark' : ''}`}
          />
        </div>
        <div className={`cart-scroll ${darkMode ? 'dark' : ''}`}>
          <table className={`cart-table ${darkMode ? 'dark' : ''}`}>
            <thead className={`cart-table-head ${darkMode ? 'dark' : ''}`}>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className={`cart-table-body ${darkMode ? 'dark' : ''}`}>
              {filteredCart.map((item, index) => (
                <tr key={index}>
                  <td>{item.itemName}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className={darkMode ? 'dark' : ''}
                    />
                  </td>
                  <td>${item.sellingPrice}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.discount}
                      onChange={(e) => applyDiscount(index, e.target.value)}
                      className={darkMode ? 'dark' : ''}
                    />
                  </td>
                  <td>${(item.sellingPrice * item.quantity - item.discount).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => removeFromCart(index)}
                      className={`removebtn ${darkMode ? 'dark' : ''}`}
                    >
                      <img src={remicon} alt="remove" width="30" height="30" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`payment-summary ${darkMode ? 'dark' : ''}`}>
          <div className="summary-row">
            <h3 className={`subtotal ${darkMode ? 'dark' : ''}`}>
              Subtotal: ${calculateSubtotal().toFixed(2)}
            </h3>
            <h3 className={`total-discount ${darkMode ? 'dark' : ''}`}>
              Discount: ${calculateTotalDiscount().toFixed(2)}
            </h3>
          </div>
          <div className="summary-row">
            <h3 className={`total ${darkMode ? 'dark' : ''}`}>
              Total: ${calculateTotal().toFixed(2)}
            </h3>
            <h3 className={`total-items ${darkMode ? 'dark' : ''}`}>
              Items: {calculateTotalItems()}
            </h3>
          </div>
          <button
            className={`pay-btn ${darkMode ? 'dark' : ''}`}
            onClick={() => setShowPopup(true)}
            disabled={cart.length === 0 || !cashierId || !cashierName || cashierId === 'N/A'}
          >
            Complete Payment
          </button>
          
        </div>

        {showPopup && (
          <PaymentPaid
            totalAmount={calculateTotal()}
            items={cart}
            onClose={handlePaymentClose}
            darkMode={darkMode}
            cashierId={cashierId}
            cashierName={cashierName}
            isWholesale={isWholesale}
            customerDetails={customerDetails}
            customerName={customerName}
            contactNumber={contactNumber}
            address={address}
          />
        )}

        {showReturnPopup && (
          <ReturnPayment
            onClose={handleReturnClose}
            darkMode={darkMode}
            cashierId={cashierId}
            cashierName={cashierName}
          />
        )}

        {showShopSettings && (
          <ShopSettings
            darkMode={darkMode}
            onClose={() => setShowShopSettings(false)}
          />
        )}

        {latestInvoiceNumber && (
          <div className={`invoice-display ${darkMode ? 'dark' : ''}`}>
            <h3 className={`invoice-number ${darkMode ? 'dark' : ''}`}>
              Latest Invoice Number: {latestInvoiceNumber}
            </h3>
          </div>
        )}

        <div className={`checkbox-group ${darkMode ? 'dark' : ''}`}>
          <label className={`check-box-lbl ${darkMode ? 'dark' : ''}`}>
            <input
              type="checkbox"
              onChange={() => {
                setPaymentType('Credit');
                setShowCustomerForm(true);
              }}
            />
               Credit and Wholesale
          </label>
        </div>
      </div>

      {showCustomerForm && (
        <CustomerForm
          totalAmount={calculateTotal()}
          paymentType={paymentType}
          onClose={() => setShowCustomerForm(false)}
          onSubmit={handleCustomerSubmit}
          darkMode={darkMode}
          cashierId={cashierId}
          cashierName={cashierName}
        />
      )}

      <div className={`product-list ${darkMode ? 'dark' : ''}`}>
      <h2 className={`salary-list-title ${darkMode ? 'dark' : ''}`}>PRODUCTS</h2>
      <div className="cashier-button-container">
          {showCashierCard && (
            <div className={`cashier-card ${darkMode ? 'dark' : ''}`}>
              <h4>Cashier Details</h4>
              <p><strong>Name:</strong> {cashierName}</p>
              <p><strong>ID:</strong> {cashierId}</p>
              <button
                className={`close-card-btn ${darkMode ? 'dark' : ''}`}
                onClick={toggleCashierCard}
              >
                Close
              </button>
            </div>
          )}
        </div>

        <div className="product-search-container">
          <input
            type="text"
            placeholder="🔍 Search by code, name, buying or selling price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`productsearch ${darkMode ? 'dark' : ''}`}
          />
          <button
            className={`add-btn ${darkMode ? 'dark' : ''}`}
            onClick={() => filteredProducts.length > 0 && addToCart(filteredProducts[0])}
            disabled={filteredProducts.length === 0}
          >
            <FontAwesomeIcon icon={faCartPlus} size="lg" />
          </button>
        </div>

        <div className={`product-grid ${darkMode ? 'dark' : ''}`}>
          {filteredProducts.length === 0 ? (
            <p className={`no-products ${darkMode ? 'dark' : ''}`}>No products found</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id} className={`product-card ${darkMode ? 'dark' : ''}`}>
                <div className="product-info">
                  <span className={`product-code ${darkMode ? 'dark' : ''}`}>{product.itemCode}</span>
                  <span className={`product-name ${darkMode ? 'dark' : ''}`}>{product.itemName}</span>
                  <span className={`product-price ${darkMode ? 'dark' : ''}`}>
                    Sell: ${product.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className={`add-to-cart-btn ${darkMode ? 'dark' : ''}`}
                >
                  <FontAwesomeIcon icon={faCartPlus} size="lg" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;