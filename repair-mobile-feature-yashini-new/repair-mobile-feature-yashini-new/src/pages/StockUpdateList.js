import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../styles/StockUpdateList.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFile, faSearch, faFileExcel, faFilePdf, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://localhost:5002/api/products";

const StockUpdateList = ({ darkMode }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Update List", 14, 15);

    let yPos = 20;

    sortedCategories.forEach((category) => {
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(category, 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "GRN",
            "ITEM NAME",
            "OLD STOCK",
            "NEW STOCK",
            "OLD BUYING PRICE",
            "NEW BUYING PRICE",
            "OLD SELLING PRICE",
            "NEW SELLING PRICE",
          ],
        ],
        body: groupedByCategory[category].map((product) => [
          product.itemCode,
          product.itemName,
          product.oldStock || 0,
          product.stock,
          product.oldBuyingPrice || 0,
          product.buyingPrice,
          product.oldSellingPrice || 0,
          product.sellingPrice,
        ]),
      });

      yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save("Stock_Update_List.pdf");
    setShowReportOptions(false);
  };

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();

    sortedCategories.forEach((category) => {
      const categoryProducts = groupedByCategory[category];

      const worksheet = XLSX.utils.json_to_sheet(
        categoryProducts.map((product) => ({
          "GRN": product.itemCode,
          "ITEM NAME": product.itemName,
          "OLD STOCK": product.oldStock || 0,
          "NEW STOCK": product.stock,
          "OLD BUYING PRICE": product.oldBuyingPrice || 0,
          "NEW BUYING PRICE": product.buyingPrice,
          "OLD SELLING PRICE": product.oldSellingPrice || 0,
          "NEW SELLING PRICE": product.sellingPrice,
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, category.substring(0, 31));
    });

    const summaryWorksheet = XLSX.utils.json_to_sheet(
      filteredProducts.map((product) => ({
        "GRN": product.itemCode,
        "ITEM NAME": product.itemName,
        "CATEGORY": product.category,
        "OLD STOCK": product.oldStock || 0,
        "NEW STOCK": product.stock,
        "OLD BUYING PRICE": product.oldBuyingPrice || 0,
        "NEW BUYING PRICE": product.buyingPrice,
        "OLD SELLING PRICE": product.oldSellingPrice || 0,
        "NEW SELLING PRICE": product.sellingPrice,
      }))
    );

    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "All Products");
    XLSX.writeFile(workbook, "Stock_Update_List.xlsx");
    setShowReportOptions(false);
  };

  const filteredProducts = products.filter((product) =>
    product.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedByCategory).sort();

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleEdit = (product) => {
    navigate("/StockUpdate", { 
      state: { 
        darkMode,
        editProduct: product,
        isEditing: true
      } 
    });
    setShowActionMenu(null);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this stock record?")) {
      try {
        const response = await fetch(`${API_URL}/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete stock record');
        }

        // Remove the product from the local state
        setProducts(products.filter(product => product._id !== productId));
        
        // Show success message
        alert('Stock record deleted successfully!');
        setShowActionMenu(null);
      } catch (error) {
        console.error('Error deleting stock record:', error);
        alert('Failed to delete stock record. Please try again.');
      }
    }
  };

  return (
    <div className={`product-list-container ${darkMode ? "dark" : ""}`}>
      <div className="header-section">
        <h2 className={`product-list-title ${darkMode ? "dark" : ""}`}>
          STOCK UPDATE LIST
        </h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container ${darkMode ? "dark" : ""}`}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="       Search Item Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`product-list-search-bar ${darkMode ? "dark" : ""}`}
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="search-clear-btn">
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => navigate("/StockUpdate", { state: { darkMode } })}
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} /> Add Stock Update
        </button>
        <button
          onClick={() => setShowReportOptions(true)}
          className="btn-report"
        >
          <FontAwesomeIcon icon={faFile} /> Reports
        </button>
      </div>
      {showReportOptions && (
        <div className="report-modal-overlay" onClick={() => setShowReportOptions(false)}>
          <div className={`report-modal-content ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3 className="report-modal-title">Select Report Type</h3>
              <button
                onClick={() => setShowReportOptions(false)}
                className="report-modal-close-icon"
              >
                ✕
              </button>
            </div>
            <div className="report-modal-buttons">
              <button
                onClick={generateExcel}
                className="btn-report-e"
                style={{ background: 'green' }}
              >
                <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Excel
              </button>
              <button
                onClick={generatePDF}
                className="btn-report-p"
                style={{ background: 'red' }}
              >
                <FontAwesomeIcon icon={faFilePdf} className="report-btn-icon" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading">Loading...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="no-results">No matching results found.</p>
      ) : (
        <div className="stock-update-categories-container">
          {sortedCategories.map((category) => (
            <div key={category} className={`category-section ${darkMode ? "dark" : ""}`} >
              <h3 className={`category-header ${darkMode ? "dark" : ""}`}>{category}</h3>
              <div className="stock-update-table-container">
                <table className={`stock-update-table ${darkMode ? "dark" : ""}`}>
                  <thead>
                    <tr>
                      <th>GRN</th>
                      <th>Item Name</th>
                      <th>Old Stock</th>
                      <th>New Stock</th>
                      <th>Old Buying</th>
                      <th>New Buying</th>
                      <th>Old Selling</th>
                      <th>New Selling</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByCategory[category].map((product) => (
                      <tr key={product._id}>
                        <td>{product.itemCode}</td>
                        <td>{product.itemName}</td>
                        <td className="old-value">{product.oldStock || 0}</td>
                        <td className="new-value">{product.stock}</td>
                        <td className="old-value">{product.oldBuyingPrice || 0}</td>
                        <td className="new-value">{product.buyingPrice}</td>
                        <td className="old-value">{product.oldSellingPrice || 0}</td>
                        <td className="new-value">{product.sellingPrice}</td>
                        <td>
                          <div className="action-container">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setShowActionMenu(showActionMenu === product._id ? null : product._id);
                              }}
                              className="action-dot-btn"
                            >
                              ⋮
                            </button>
                            {showActionMenu === product._id && (
                              <div className={`action-menu ${darkMode ? 'dark' : ''}`} onMouseLeave={() => setShowActionMenu(null)}>
                                <button onClick={() => handleEdit(product)} className="p-edit-btn">
                                  <div className="action-btn-content">
                                    <FontAwesomeIcon icon={faEdit} className="p-edit-btn-icon" />
                                    <span>✏️ EDIT STOCK RECORD</span>
                                  </div>
                                </button>
                                <button onClick={() => handleDelete(product._id)} className="p-delete-btn">
                                  <div className="action-btn-content">
                                    <FontAwesomeIcon icon={faTrash} className="p-delete-btn-icon" />
                                    <span>Delete</span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockUpdateList;