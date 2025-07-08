import React, { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../styles/Barcode.css';

const SHOP_NAME = "My Awesome Shop"; // Customize this

const BarcodeGenerator = ({ itemCode, itemName, sellingPrice, darkMode, onClose }) => {
  const barcodeRef = useRef(null);
  const [quantity, setQuantity] = useState(1); // State for barcode quantity

  // Generate single barcode for display
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        bwipjs.toCanvas('barcode-canvas', {
          bcid: 'code128',
          text: itemCode,
          scale: 3,
          height: 10,
          includetext: false,
          textxalign: 'center',
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [itemCode]);

  // Download barcode as PNG (single barcode)
  const downloadPNG = () => {
    const canvas = document.getElementById('barcode-canvas');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${itemCode}_barcode.png`;
    link.click();
  };

  // Download barcode as PDF (multiple barcodes based on quantity)
  const downloadPDF = () => {
    html2canvas(barcodeRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const barcodeHeight = (canvas.height * pageWidth) / canvas.width;
      const barcodesPerPage = Math.floor(pageHeight / barcodeHeight); // Calculate how many fit per page
      let yPosition = 0;
      let currentPage = 1;

      // Loop through the quantity to add barcodes
      for (let i = 0; i < quantity; i++) {
        if (yPosition + barcodeHeight > pageHeight) {
          pdf.addPage();
          yPosition = 0;
          currentPage++;
        }
        pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, barcodeHeight);
        yPosition += barcodeHeight;
      }

      pdf.save(`${itemCode}_barcode_${quantity}.pdf`);
    });
  };

  // Handle quantity input change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setQuantity(value > 0 ? value : 1); // Ensure quantity is at least 1
  };

  return (
    <div className="barcode-modal-overlay">
      <div className={`barcode-modal-content ${darkMode ? 'dark' : ''}`}>
        <div className="barcode-header">
          <h3>Barcode</h3>
          <button className="barcode-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div ref={barcodeRef} className="barcode-container">
          <div className="shop-name">{SHOP_NAME}</div>
          <canvas id="barcode-canvas" />
          <div className="barcode-details">
            <p>{itemName}</p>
            <p>Rs. {sellingPrice.toFixed(2)}</p>
          </div>
        </div>
        <div className="barcode-quantity">
          <label htmlFor="quantity">Quantity: </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            className={darkMode ? 'dark' : ''}
          />
        </div>
        <div className="barcode-actions">
          <button className={`barcode-download-btn ${darkMode ? 'dark' : ''}`} onClick={downloadPNG}>
            Download PNG
          </button>
          <button className={`barcode-download-btn ${darkMode ? 'dark' : ''}`} onClick={downloadPDF}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;