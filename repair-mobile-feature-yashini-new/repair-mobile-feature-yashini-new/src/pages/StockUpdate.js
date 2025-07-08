import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/StockUpdate.css"; // Ensure you have dark mode styles

const API_URL = "http://localhost:5002/api/products";

const StockUpdate = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = location.state?.isEditing;
  const editProduct = location.state?.editProduct;
  
  const [itemCode, setItemCode] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newStock, setNewStock] = useState(0);
  const [newBuyingPrice, setNewBuyingPrice] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [itemName, setItemName] = useState(""); // Added state for itemName
  const [category, setCategory] = useState(""); // Added state for category
  const [supplierName, setSupplierName] = useState(""); // Added state for supplierName

  // Initialize form with edit data if in edit mode
  useEffect(() => {
    if (isEditing && editProduct) {
      setItemCode(editProduct.itemCode);
      setProduct(editProduct);
      setNewStock(0);
      setNewBuyingPrice(editProduct.buyingPrice);
      setNewSellingPrice(editProduct.sellingPrice);
      setItemName(editProduct.itemName);
      setCategory(editProduct.category);
      setSupplierName(editProduct.supplierName);
    }
  }, [isEditing, editProduct]);

  // Fetch product details by item code
  const fetchProduct = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/itemCode/${itemCode}`);
      if (!response.ok) throw new Error("Product not found");

      const data = await response.json();
      setProduct(data);
      setNewStock(0);
      setNewBuyingPrice(data.buyingPrice);
      setNewSellingPrice(data.sellingPrice);
      setItemName(data.itemName); // Set itemName from fetched product
      setCategory(data.category); // Set category from fetched product
      setSupplierName(data.supplierName); // Set supplierName from fetched product
    } catch (err) {
      setError(err.message);
      setProduct(null);
      setItemName(""); // Reset itemName on error
      setCategory(""); // Reset category on error
      setSupplierName(""); // Reset supplierName on error
    } finally {
      setLoading(false);
    }
  };

  // Handle stock update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Frontend validation
    if (!newBuyingPrice || newBuyingPrice === "" || Number(newBuyingPrice) < 0) {
      setError("New buying price is required and must be a non-negative number");
      setLoading(false);
      return;
    }

    if (!newSellingPrice || newSellingPrice === "" || Number(newSellingPrice) < 0) {
      setError("New selling price is required and must be a non-negative number");
      setLoading(false);
      return;
    }

    if (newStock === undefined || newStock === "" || Number(newStock) < 0) {
      setError("New stock is required and must be a non-negative number");
      setLoading(false);
      return;
    }

    if (!itemName || itemName.trim() === "") {
      setError("Item name is required");
      setLoading(false);
      return;
    }

    if (!category || category.trim() === "") {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (!supplierName || supplierName.trim() === "") {
      setError("Supplier name is required");
      setLoading(false);
      return;
    }

    try {
      let response;
      
      if (isEditing && editProduct) {
        // Update existing product
        response = await fetch(`${API_URL}/${editProduct._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemCode: itemCode,
            itemName: itemName,
            category: category,
            buyingPrice: Number(newBuyingPrice),
            sellingPrice: Number(newSellingPrice),
            stock: product.stock + Number(newStock), // Add new stock to existing stock
            supplierName: supplierName,
          }),
        });
      } else {
        // Create new stock update
        response = await fetch(`${API_URL}/update-stock/${itemCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStock: Number(newStock),
            newBuyingPrice: Number(newBuyingPrice),
            newSellingPrice: Number(newSellingPrice),
            itemName: itemName || product?.itemName || "", // Include itemName
            category: category || product?.category || "", // Include category
            supplierName: supplierName || product?.supplierName || "Default Supplier", // Include supplierName
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update stock");
      }

      setSuccess(isEditing ? "✅ Stock record updated successfully!" : "✅ Stock updated successfully!");
      setTimeout(() => navigate("/StockUpdateList"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`stock-update-container ${darkMode ? 'dark' : ''}`}>
      <div className={`us-form-wrapper ${darkMode ? 'dark' : ''}`}>
        <h2 className="produ-modal-title">
          {isEditing ? "✏️ EDIT STOCK RECORD" : "📦 Update Stock"}
        </h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className={`search-section ${darkMode ? 'dark' : ''}`}>
          <input
            type="text"
            placeholder="Enter GRN"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            className={`su-input ${darkMode ? 'dark' : ''}`}
            readOnly={isEditing}
            disabled={isEditing}
          />
          <button 
            onClick={fetchProduct} 
            disabled={loading || isEditing} 
            className={`search-btn ${darkMode ? 'dark' : ''}`}
          >
            {loading ? "Searching..." : isEditing ? "Editing Mode" : "Find Product"}
          </button>
        </div>

        {(product || isEditing) && (
          <form className="update-form" onSubmit={handleUpdate}>
            <p className={`up-p ${darkMode ? 'dark' : ''}`}><strong>ITEM NAME:</strong> {product?.itemName || itemName}</p>
            <p className={`up-p ${darkMode ? 'dark' : ''}`}><strong>CATEGORY:</strong> {product?.category || category}</p>
            
            {/* Stock Information Section */}
            <div className={`stock-info-section ${darkMode ? 'dark' : ''}`}>
              <h3 className={`stock-info-title ${darkMode ? 'dark' : ''}`}>Stock Information</h3>
              
              <div className={`stock-display-row ${darkMode ? 'dark' : ''}`}>
                <div className={`stock-display-item ${darkMode ? 'dark' : ''}`}>
                  <label className={`stock-label ${darkMode ? 'dark' : ''}`}>CURRENT STOCK:</label>
                  <span className={`stock-value current-stock ${darkMode ? 'dark' : ''}`}>
                    {product?.stock || 0}
                  </span>
                </div>
                
                <div className={`stock-display-item ${darkMode ? 'dark' : ''}`}>
                  <label className={`stock-label ${darkMode ? 'dark' : ''}`}>ADDITIONAL STOCK TO ADD:</label>
                  <span className={`stock-value additional-stock ${darkMode ? 'dark' : ''}`}>
                    {Number(newStock) || 0}
                  </span>
                </div>
              </div>
              
              <div className={`stock-display-row ${darkMode ? 'dark' : ''}`}>
                <div className={`stock-display-item ${darkMode ? 'dark' : ''}`}>
                  <label className={`stock-label ${darkMode ? 'dark' : ''}`}>NEW STOCK AFTER UPDATE:</label>
                  <span className={`stock-value new-stock ${darkMode ? 'dark' : ''}`}>
                    {(product?.stock || 0) + (Number(newStock) || 0)}
                  </span>
                </div>
              </div>
              
              <div className={`stock-input-row ${darkMode ? 'dark' : ''}`}>
                <label className={`update-form-label ${darkMode ? 'dark' : ''}`}>ENTER ADDITIONAL STOCK:</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  min="0"
                  required
                  className={`stock-input ${darkMode ? 'dark' : ''}`}
                  placeholder="Enter quantity to add"
                />
              </div>
            </div>

            <label className={`update-form-label ${darkMode ? 'dark' : ''}`}>NEW BUYING PRICE:</label>
            <input
              type="number"
              value={newBuyingPrice}
              onChange={(e) => setNewBuyingPrice(e.target.value)}
              min="0"
              step="0.01"
              required
              className={`stock-input ${darkMode ? 'dark' : ''}`}
              placeholder="Enter buying price"
            />

            <label className={`update-form-label ${darkMode ? 'dark' : ''}`}>NEW SELLING PRICE:</label>
            <input
              type="number"
              value={newSellingPrice}
              onChange={(e) => setNewSellingPrice(e.target.value)}
              min="0"
              step="0.01"
              required
              className={`stock-input ${darkMode ? 'dark' : ''}`}
              placeholder="Enter selling price"
            />

            {/* Hidden inputs to ensure itemName, category, and supplierName are sent */}
            <input type="hidden" value={itemName} />
            <input type="hidden" value={category} />
            <input type="hidden" value={supplierName} />

            <button type="submit" className={`update-btn ${darkMode ? 'dark' : ''}`} disabled={loading}>
              {loading ? "Updating..." : isEditing ? "Update Stock Record" : "Update Stock"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StockUpdate;