import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirect
import '../styles/ReturnPayment.css';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import removeicon from '../icon/info.png';

const ReturnPayment = ({ onClose, darkMode, cashierId, cashierName }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/');
      return;
    }

    // Fetch all products with authorization header
    axios.get('http://localhost:5002/api/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        console.log('Products fetched:', res.data); // Debug log
        setProducts(res.data);
      })
      .catch(err => {
        console.error('Error fetching products:', err.response?.data); // Debug log
        if (err.response?.status === 401) {
          alert('Session expired or invalid token. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          navigate('/');
        }
        setError('Failed to load products. Please try again.');
      });
  }, [navigate]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products.filter(product =>
    product.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToReturn = (product) => {
    const existingItem = returnItems.find(item => item.productId === product._id);
    if (!existingItem) {
      setReturnItems([...returnItems, { ...product, productId: product._id, quantity: 1, discount: 0 }]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...returnItems];
    updatedItems[index].quantity = Math.max(1, Number(value));
    setReturnItems(updatedItems);
  };

  const removeFromReturn = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
  };

  const generateReturnBill = (returnData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6'
    });

    // Retrieve shop details from localStorage
    const shopName = localStorage.getItem('shopName') || 'Default Shop';
    const shopAddress = localStorage.getItem('shopAddress') || '123 Main St, City, Country';
    const shopPhone = localStorage.getItem('shopPhone') || '(123) 456-7890';

    // Add shop details to the receipt
    doc.setFontSize(12);
    doc.text("RETURN RECEIPT", 55, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text(shopName, 55, 15, { align: "center" });
    doc.text(shopAddress, 55, 20, { align: "center" });
    doc.text(`Phone: ${shopPhone}`, 55, 25, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 35);
    doc.text(`Cashier: ${cashierName} (ID: ${cashierId})`, 10, 40);
    doc.text(`Return Invoice: ${returnData.returnInvoiceNumber}`, 10, 45);

    let y = 55;
    doc.text("------------------------------------", 10, y);
    y += 5;
    doc.text("Item Name          Qty    Total", 10, y);
    y += 5;
    doc.text("------------------------------------", 10, y);

    returnItems.forEach(item => {
      const total = (item.sellingPrice * item.quantity).toFixed(2);
      y += 5;
      doc.text(`${item.itemName.slice(0, 15)} ${item.quantity}     Rs. ${total}`, 10, y);
    });

    y += 5;
    doc.text("------------------------------------", 10, y);
    y += 5;
    doc.text(`Total Refund: Rs. ${calculateReturnTotal().toFixed(2)}`, 10, y);

    doc.save(`Return_Receipt_${returnData.returnInvoiceNumber}.pdf`);
  };

  const handleReturnPayment = async () => {
    if (returnItems.length === 0) {
      alert("Please add at least one item to return.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      navigate('/');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5002/api/payments/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: returnItems.map(item => ({
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.sellingPrice,
            discount: item.discount,
          })),
          totalRefund: calculateReturnTotal(),
          cashierId,
          cashierName,
        }),
      });

      const data = await response.json();
      console.log('Return response:', data); // Debug log
      setLoading(false);

      if (response.ok) {
        alert(`Return successful!\nTotal Refund: Rs. ${calculateReturnTotal().toFixed(2)}\nReturn Invoice: ${data.returnInvoiceNumber}`);
        generateReturnBill(data);
        onClose(data.returnInvoiceNumber);
      } else {
        if (response.status === 401) {
          alert("Session expired or invalid token. Please log in again.");
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          navigate('/');
        } else {
          alert(`Error: ${data.message || 'Failed to process return.'}`);
        }
      }
    } catch (error) {
      console.error('Return error:', error); // Debug log
      setLoading(false);
      alert("Failed to process return. Please try again.");
    }
  };

  return (
    <div className="return-popup">
      <div className={`return-popup-content ${darkMode ? "dark-mode" : ""}`}>
        <h2 className={`return-title ${darkMode ? "dark-mode" : ""}`}>Return Payment</h2>
        {error && <p className={`error-message ${darkMode ? "dark-mode" : ""}`}>{error}</p>}
        
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Search by item code..."
            value={searchQuery}
            onChange={handleSearch}
            className={`return-search ${darkMode ? "dark-mode" : ""}`}
          />
          <div className="product-results">
            {filteredProducts.slice(0, 5).map(product => (
              <div key={product._id} className={`product-item ${darkMode ? "dark-mode" : ""}`}>
                <span>{product.itemCode} - {product.itemName} - Rs. {product.sellingPrice}</span>
                <div className="product-results-button">
                  <button onClick={() => addToReturn(product)}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="return-items">
          <table className={`return-table ${darkMode ? "dark-mode" : ""}`}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {returnItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.itemName}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className={darkMode ? "dark-mode" : ""}
                    />
                  </td>
                  <td>Rs. {item.sellingPrice}</td>
                  <td>Rs. {(item.sellingPrice * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromReturn(index)}
                    >
                      <img src={removeicon} alt="remove" width="30" height="30" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={`return-total ${darkMode ? "dark-mode" : ""}`}>
          <strong>Total Refund:</strong> Rs. {calculateReturnTotal().toFixed(2)}
        </p>

        <div className="return-buttons">
          <button
            className={`return-confirm-btn ${darkMode ? "dark-mode" : ""}`}
            onClick={handleReturnPayment}
            disabled={returnItems.length === 0 || loading}
          >
            {loading ? "Processing..." : "Confirm Return"}
          </button>
          <button
            className={`return-cancel-btn ${darkMode ? "dark-mode" : ""}`}
            onClick={() => onClose(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnPayment;