import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PaymentPaid.css";
import { jsPDF } from 'jspdf';
import paymenticon from "../icon/pos-terminal3.png";

const PaymentPaid = ({ totalAmount, items, onClose, darkMode, cashierId, cashierName, isWholesale, customerDetails, customerName, contactNumber, address }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPaidAmount("");
    setBalance(0);
    console.log('PaymentPaid props:', { customerName, contactNumber, address }); // Debug log
  }, [totalAmount, customerName, contactNumber, address]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["Enter", "Backspace", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."].includes(e.key)) {
        e.preventDefault();
      }

      if (/^[0-9]$/.test(e.key) || e.key === ".") {
        handlePaidAmountChange(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Enter") {
        if (paymentMethod && parseFloat(paidAmount || 0) >= totalAmount && !loading) {
          handleConfirmPayment();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paidAmount, paymentMethod, loading, totalAmount]);

  const handlePaidAmountChange = (value) => {
    const input = paidAmount + value;
    if (/^\d*\.?\d*$/.test(input)) {
      setPaidAmount(input);
      const newBalance = parseFloat(input || 0) - totalAmount;
      setBalance(newBalance);
    }
  };

  const handleDelete = () => {
    const newPaidAmount = paidAmount.slice(0, -1);
    setPaidAmount(newPaidAmount);
    const newBalance = parseFloat(newPaidAmount || 0) - totalAmount;
    setBalance(newBalance);
  };

const generatePaymentBill = (paymentData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 140] // Small receipt size
  });

  // Shop details
  const shopName = localStorage.getItem('shopName') || 'GENIUS';
  const shopAddress = localStorage.getItem('shopAddress') || '#422 Thimbirigasyaya Road, Colombo 05';
  const shopPhone = localStorage.getItem('shopPhone') || '0770235330';
  const shopEmail = localStorage.getItem('shopEmail') || 'igentuslk@gmail.com';

  // Set font and styles
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Shop title (centered)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(shopName, 40, 5, { align: "center" });
  doc.setFontSize(10);
  doc.text("YOUR TRUSTED REPAIR PARTNER", 40, 10, { align: "center" });
  doc.text(shopAddress, 40, 15, { align: "center" });

  doc.text(shopPhone, 10, 20);
  doc.text(`/ ${shopEmail}`, 30, 20);

    // Divider line
  doc.line(5, 30, 75, 30);

  doc.text(`INVOICE NO ${paymentData.invoiceNumber.split('-')[1]}`, 25, 35);

  // Divider line
  doc.line(5, 40, 75, 40);
  
  // Customer details table
  const customerStartY = 45;
  let y = customerStartY;
  
  // Table headers
  doc.setFont("helvetica", "bold");
  doc.text("NAME:", 5, y);
  doc.text("CONTACT:", 5, y + 5);
  doc.text("ADDRESS:", 5, y + 10);
  
  // Customer data
  doc.setFont("helvetica", "normal");
  doc.text(customerName || "SAHAN", 20, y);
  doc.text(contactNumber || "JB76666666", 25, y + 5);
  doc.text(address || "uwara", 25, y + 10);

  doc.setFont("helvetica", "normal");

  y += 15;
  doc.line(5, y, 75, y);
  y += 5;
  
  // Items table header
  doc.setFont("helvetica", "bold");
  doc.text("QTY", 5, y);
  doc.text("DESCRIPTION", 15, y);
  doc.text("AMOUNT", 60, y);
  
  y += 5;
  doc.line(5, y, 75, y);
  y += 5;
  
  // Items list
  doc.setFont("helvetica", "normal");
  items.forEach(item => {
    // Item name (truncate if too long)
    const itemName = item.itemName.length > 15 ? item.itemName.substring(0, 15) + '...' : item.itemName;
    
    doc.text(item.quantity.toString(), 5, y);
    doc.text(itemName, 15, y);
    doc.text(`Rs. ${(item.sellingPrice * item.quantity).toFixed(2)}`, 55, y);
    y += 5;
    
    // Handle discounts if any
    if (item.discount > 0) {
      doc.text(`Discount: Rs. ${item.discount.toFixed(2)}`, 15, y);
      y += 5;
    }
  });
  
  // Total section
  y += 5;
  doc.line(5, y, 75, y);
  y += 5;
  
  doc.setFont("helvetica", "bold");

  doc.text("TOTAL", 30, y);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, 55, y);

    // Divider line
  doc.line(5, 95, 75, 95);

  // Footer
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 40, y, { align: "center" });
  y += 5;
  doc.text("Software by Exyplan Software", 40, y, { align: "center" });
  y += 5;
  doc.text("Contact: 074 357 3323", 40, y, { align: "center" });

  // Save the PDF
  doc.save(`POS_Receipt_${paymentData.invoiceNumber}.pdf`);
  
  if (isWholesale) {
    localStorage.removeItem('wholesaleCustomer');
  }
};

  const generateCustomBill = () => {
    const shopName = localStorage.getItem('shopName') || 'Default Shop';
    const shopAddress = localStorage.getItem('shopAddress') || '123 Main St, City, Country';
    const shopPhone = localStorage.getItem('shopPhone') || '(123) 456-7890';
    const shopLogo = localStorage.getItem('shopLogo') || '';

    const billWindow = window.open("", "_blank");
    billWindow.document.write(`
      <html>
        <head>
          <title>${isWholesale ? "Wholesale POS Bill" : "Payment Bill"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 0;
            }
            .bill-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border: 1px solid #ddd;
              box-shadow: 0 0 0px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header img {
              max-width: 100px;
              max-height: 100px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .details, .totals {
              margin-bottom: 20px;
            }
            .details p, .totals p {
              margin: 5px 0;
              font-size: 14px;
            }
            .details strong, .totals strong {
              display: inline-block;
              width: 150px;
              color: #333;
            }
            .details-container {
              display: flex;
              justify-content: space-between;
            }
            .details-left, .details-right {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              color: #333;
            }
            .totals {
              border: 0px solid #ddd;
              padding: 10px;
            }
            .totals p {
              font-weight: bold;
               border: 1px solid #ddd;
               padding:5px;
            }
            .print-btn {
              display: block;
              width: 100px;
              margin: 20px auto;
              padding: 10px;
              background-color: #28a745;
              color: white;
              border: none;
              cursor: pointer;
              text-align: center;
            }
            .print-btn:hover {
              background-color: #218838;
            }
            @media print {
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="header">
              ${shopLogo ? `<img src="${shopLogo}" alt="Shop Logo" />` : ''}
              <h1>${isWholesale ? "Wholesale POS Receipt" : "Payment Receipt"}</h1>
              <p>${shopName}</p>
              <p>${shopAddress}</p>
              <p>Phone: ${shopPhone}</p>
            </div>
            <div class="details">
              <div class="details-container">
                <div class="details-left">
                  ${isWholesale && customerDetails ? `
                    <p><strong>Customer:</strong> ${customerDetails.customerName || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${customerDetails.mobile || 'N/A'}</p>
                    <p><strong>Address:</strong> ${customerDetails.nic || 'N/A'}</p>
                  ` : `
                    <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${contactNumber || 'N/A'}</p>
                    <p><strong>Address:</strong> ${address || 'N/A'}</p>
                  `}
                </div>
                <div class="details-right">
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                 
                  <p><strong>Payment Method:</strong> ${paymentMethod || "Not Selected"}</p>
                </div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.itemName}</td>
                        <td>${item.quantity}</td>
                        <td>Rs. ${item.sellingPrice.toFixed(2)}</td>
                        <td>Rs. ${(item.discount || 0).toFixed(2)}</td>
                        <td>Rs. ${(item.sellingPrice * item.quantity - (item.discount || 0)).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="totals">
             <div class="details-container">
              <div class="details-left">
              <p><strong>Subtotal:</strong> Rs. ${items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0).toFixed(2)}</p>
              <p><strong>Total Discount:</strong> Rs. ${items.reduce((sum, item) => sum + (item.discount || 0), 0).toFixed(2)}</p>
              <p><strong>Total Amount:</strong> Rs. ${totalAmount.toFixed(2)}</p>
              </div>
              <div class="details-right">
              <p><strong>Paid Amount:</strong> Rs. ${paidAmount || "0.00"}</p>
              <p><strong>Balance:</strong> Rs. ${balance.toFixed(2)}</p>
            </div>
            </div>
            </div>
            <button class="print-btn" onclick="window.print()">Print Bill</button>
          </div>
        </body>
      </html>
    `);
    billWindow.document.close();
    if (isWholesale) {
      localStorage.removeItem('wholesaleCustomer');
    }
  };

  const handleConfirmPayment = async () => {
    const paid = parseFloat(paidAmount) || 0;
    const token = localStorage.getItem("token");
    console.log('PaymentPaid - Sending payment with:', { customerName, contactNumber, address }); // Debug log

    if (!items || items.length === 0) {
      alert("No items in the cart to process payment.");
      return;
    }
    if (paid < totalAmount) {
      alert("Paid amount is less than the total. Please enter the correct amount.");
      return;
    }
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      navigate('/cashier/login');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5002/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(({ _id, itemName, quantity, sellingPrice, discount }) => ({
            productId: _id,
            itemName,
            quantity,
            price: sellingPrice,
            discount: discount || 0,
          })),
          totalAmount,
          discountApplied: items.reduce((sum, item) => sum + (item.discount || 0), 0),
          paymentMethod,
          cashierId,
          cashierName,
          isWholesale: isWholesale || false,
          customerDetails: isWholesale ? customerDetails : null,
          customerName: customerName || '',
          contactNumber: contactNumber || '',
          address: address || ''
        }),
      });

      const data = await response.json();
      console.log('Payment response:', data); // Debug log
      setLoading(false);

      if (response.ok) {
        alert(`Payment successful!\nMethod: ${paymentMethod}\nTotal: Rs. ${totalAmount.toFixed(2)}\nPaid: Rs. ${paid.toFixed(2)}\nBalance: Rs. ${balance.toFixed(2)}\nInvoice Number: ${data.invoiceNumber}`);
        generatePaymentBill(data.payment);
        onClose(data.invoiceNumber);
      } else {
        if (response.status === 401) {
          alert("Session expired or invalid token. Please log in again.");
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          navigate('/cashier/login');
        } else {
          alert(`Error: ${data.message || 'Failed to process payment.'}`);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      alert("Failed to process payment. Please try again.");
    }
  };

  return (
    <div className="popup">
      <div className={`popup-content ${darkMode ? "dark-mode" : ""}`}>
        <div className="left-section">
          <h2 className={`pop-title ${darkMode ? "dark-mode" : ""}`}>Complete Payment</h2>
          <label className={`p-lbl ${darkMode ? "dark-mode" : ""}`}>Payment Method:</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option className="drop" value="">Select</option>
            <option className="drop" value="Cash">Cash</option>
            <option className="drop" value="Card">Card</option>
          </select>

          <p className={`tot-amo ${darkMode ? "dark-mode" : ""}`}>
            <strong>Total Amount:</strong> Rs. ${totalAmount.toFixed(2)}
          </p>

          <label className={`p-lbl ${darkMode ? "dark-mode" : ""}`}>Paid Amount:</label>
          <input type="text" value={paidAmount} readOnly placeholder="Enter paid amount" />

          <p className={`balance ${darkMode ? "dark-mode" : ""}`}>
            <strong>Balance:</strong> Rs. ${balance.toFixed(2)}
          </p>

          <div className="button-group">
            <button
              className={`p-con-btn ${darkMode ? "dark-mode" : ""}`}
              onClick={handleConfirmPayment}
              disabled={!paymentMethod || parseFloat(paidAmount || 0) < totalAmount || loading}
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>
            <button
              className={`p-print-btn ${darkMode ? "dark-mode" : ""}`}
              onClick={generateCustomBill}
              disabled={!paymentMethod || !paidAmount}
            >
              <img src={paymenticon} alt="bill" width="50" height="50" />
            </button>
          </div>
        </div>

        <div className="right-section">
          <button onClick={() => onClose(null)} className="p-cancel-btn">Cancel</button>
          <div className="p-dialpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map((num) => (
              <button key={num} onClick={() => handlePaidAmountChange(num.toString())}>
                {num}
              </button>
            ))}
            <button className="p-del-btn" onClick={handleDelete}>⌫</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPaid;