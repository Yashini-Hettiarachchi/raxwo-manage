import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import '../styles/PaymentTable.css';
import '../Products.css';

const PRODUCT_API = 'http://localhost:5002/api/products';
const SUPPLIER_API = 'http://localhost:5002/api/suppliers';
const JOB_API = 'http://localhost:5002/api/productsRepair';

const ENTITY_LABELS = {
  product: 'Product',
  supplier: 'Supplier',
  job: 'Job List',
};

function flattenLogs(data, entityType, entityIdField, entityNameField) {
  return data.flatMap(entity =>
    (entity.changeHistory || []).map(log => ({
      ...log,
      entityType,
      entityId: entity[entityIdField],
      entityName: entity[entityNameField] || entity[entityIdField] || '',
    }))
  );
}

const LogHistoryPage = ({ darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('job');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [excelUploads, setExcelUploads] = useState([]);
  const [excelUploadsLoading, setExcelUploadsLoading] = useState(false);

  useEffect(() => {
    async function fetchAllLogs() {
      setLoading(true);
      try {
        const [productsRes, suppliersRes, jobsRes] = await Promise.all([
          fetch(PRODUCT_API),
          fetch(SUPPLIER_API),
          fetch(JOB_API),
        ]);
        const [products, suppliers, jobs] = await Promise.all([
          productsRes.json(),
          suppliersRes.json(),
          jobsRes.json(),
        ]);
        const productLogs = flattenLogs(products, 'product', 'itemCode', 'itemName');
        const supplierLogs = flattenLogs(suppliers, 'supplier', 'supplierName', 'businessName');
        const jobLogs = flattenLogs(jobs, 'job', 'repairInvoice', 'customerName');
        setLogs([...productLogs, ...supplierLogs, ...jobLogs].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)));
      } catch (err) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllLogs();
  }, []);

  useEffect(() => {
    if (filter === 'productList') {
      setProductsLoading(true);
      fetch(PRODUCT_API)
        .then(res => res.json())
        .then(data => {
          setProducts(Array.isArray(data) ? data : data.products || []);
        })
        .catch(() => setProducts([]))
        .finally(() => setProductsLoading(false));
    } else if (filter === 'job') {
      setJobsLoading(true);
      fetch(JOB_API)
        .then(res => res.json())
        .then(data => {
          setJobs(Array.isArray(data) ? data : data.jobs || []);
        })
        .catch(() => setJobs([]))
        .finally(() => setJobsLoading(false));
    } else if (filter === 'excelUploads') {
      setExcelUploadsLoading(true);
      // Fetch both Excel uploads and products to get product details
      Promise.all([
        fetch(`${PRODUCT_API}/excel-uploads`),
        fetch(PRODUCT_API)
      ])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([excelData, productsData]) => {
          setExcelUploads(Array.isArray(excelData) ? excelData : []);
          setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
        })
        .catch(() => {
          setExcelUploads([]);
          setProducts([]);
        })
        .finally(() => setExcelUploadsLoading(false));
    }
  }, [filter]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.entityType === filter);

  const formatValue = value => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  const handleExportExcel = () => {
    const exportData = filteredLogs.map(log => ({
      Entity: ENTITY_LABELS[log.entityType],
      'Entity Name': log.entityName,
      Field: log.field,
      'Old Value': formatValue(log.oldValue),
      'New Value': formatValue(log.newValue),
      'Changed By': log.changedBy,
      'Date/Time': new Date(log.changedAt).toLocaleString(),
      'Change Type': log.changeType,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log History');
    XLSX.writeFile(wb, 'Log_History.xlsx');
  };

  return (
    <div className={`product-list-container${darkMode ? ' dark' : ''}`}>
      <div className="header-section">
        <h2 className={`product-list-title${darkMode ? ' dark' : ''}`}>LOG HISTORY</h2>
      </div>
      <div className="search-action-container">
        <div className={`search-bar-container${darkMode ? ' dark' : ''}`} style={{ maxWidth: 300 }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="product-list-search-bar"
            style={{ minWidth: 120 }}
          >
            <option value="job">Job List</option>
            <option value="cart">Add Expenses</option>
            <option value="stock">Stock Edits</option>
            <option value="selectProductsForRepair">Select Products for Repair</option>
            <option value="excelUploads">Product Uploads (Excel)</option>
          </select>
        </div>
      </div>
      {filter === 'job' ? (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`product-table${darkMode ? ' dark' : ''}`} style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Entity Name</th>
                  <th>Field</th>
                  <th>Change Type</th>
                  <th>Date/Time</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log => log.entityType === 'job').length === 0 ? (
                  <tr><td colSpan={8}>No logs found.</td></tr>
                ) : (
                  logs.filter(log => log.entityType === 'job').map((log, idx) => (
                    <tr key={idx}>
                      <td>{ENTITY_LABELS[log.entityType]}</td>
                      <td>{log.entityName}</td>
                      <td>{log.field}</td>
                      <td>{log.changeType}</td>
                      <td>{new Date(log.changedAt).toLocaleString()}</td>
                      <td>{formatValue(log.oldValue)}</td>
                      <td>{formatValue(log.newValue)}</td>
                      <td>{log.changedBy || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : filter === 'cart' ? (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`product-table${darkMode ? ' dark' : ''}`} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Item Name</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Added By</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log =>
                  (log.entityType === 'supplier' && log.changeType === 'cart') ||
                  (log.entityType === 'product' && log.changeType === 'addExpense')
                ).length === 0 ? (
                  <tr><td colSpan={6}>No add expenses found.</td></tr>
                ) : (
                  logs.filter(log =>
                    (log.entityType === 'supplier' && log.changeType === 'cart') ||
                    (log.entityType === 'product' && log.changeType === 'addExpense')
                  ).map((log, idx) => (
                    <tr key={idx}>
                      <td>{log.entityName}</td>
                      <td>{log.newValue?.itemName || log.itemName || 'N/A'}</td>
                      <td>{log.field === 'cart-add' ? 'Add' : (log.field === 'cart-update' ? 'Update' : (log.changeType === 'addExpense' ? 'Add Stock (Excel)' : log.field))}</td>
                      <td>{log.newValue?.quantity ?? log.newValue ?? 'N/A'}</td>
                      <td>{log.changedBy || 'N/A'}</td>
                      <td>{log.changedAt ? new Date(log.changedAt).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : filter === 'stock' ? (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`product-table${darkMode ? ' dark' : ''}`} style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Page</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Edited By</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log => log.entityType === 'product' && log.field === 'stock' && (log.changeType === 'update' || log.changeType === 'delete')).length === 0 ? (
                  <tr><td colSpan={6}>No logs found.</td></tr>
                ) : (
                  logs.filter(log => log.entityType === 'product' && log.field === 'stock' && (log.changeType === 'update' || log.changeType === 'delete'))
                    .map((log, idx) => {
                      // Determine the page source
                      let page = 'unknown';
                      if (log.changedBy && typeof log.changedBy === 'string') {
                        const changedByLower = log.changedBy.toLowerCase();
                        if (changedByLower.includes('repair') || changedByLower.includes('job')) {
                          page = 'job list';
                        } else if (changedByLower.includes('admin') || changedByLower.includes('stock') || changedByLower.includes('update')) {
                          page = 'product stock';
                        } else if (changedByLower.includes('product')) {
                          page = 'product';
                        } else if (changedByLower.includes('system') || changedByLower.includes('excel')) {
                          page = 'stock update';
                        }
                      }
                      // Heuristic fallback
                      if (page === 'unknown' && log.field === 'stock') {
                        if (typeof log.oldValue === 'number' && typeof log.newValue === 'number') {
                          if (log.oldValue > log.newValue) {
                            page = 'job list';
                          } else if (log.oldValue < log.newValue) {
                            page = 'stock update';
                          }
                        }
                      }
                      return (
                        <tr key={idx}>
                          <td>{log.entityName || log.productName || '-'}</td>
                          <td>{page}</td>
                          <td>{log.oldValue}</td>
                          <td>{log.newValue}</td>
                          <td>{log.changedBy}</td>
                          <td>{log.changedAt ? new Date(log.changedAt).toLocaleString() : '-'}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )
      ) : filter === 'selectProductsForRepair' ? (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`product-table${darkMode ? ' dark' : ''}`} style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Old Stock</th>
                  <th>New Stock</th>
                  <th>Edited By</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log => log.entityType === 'product' && log.field === 'stock' && (log.changeType === 'update' || log.changeType === 'delete') && (() => {
                  // Determine if this log is from Job List (SELECT PRODUCTS FOR REPAIR)
                  let page = 'Unknown';
                  if (log.changedBy && typeof log.changedBy === 'string') {
                    const changedByLower = log.changedBy.toLowerCase();
                    if (changedByLower.includes('repair') || changedByLower.includes('job')) {
                      page = 'Job List';
                    }
                  }
                  if (page === 'Unknown' && log.field === 'stock') {
                    if (typeof log.oldValue === 'number' && typeof log.newValue === 'number') {
                      if (log.oldValue > log.newValue) {
                        page = 'Job List';
                      }
                    }
                  }
                  return page === 'Job List';
                })()).length === 0 ? (
                  <tr><td colSpan={5}>No logs found.</td></tr>
                ) : (
                  logs.filter(log => log.entityType === 'product' && log.field === 'stock' && (log.changeType === 'update' || log.changeType === 'delete') && (() => {
                    let page = 'Unknown';
                    if (log.changedBy && typeof log.changedBy === 'string') {
                      const changedByLower = log.changedBy.toLowerCase();
                      if (changedByLower.includes('repair') || changedByLower.includes('job')) {
                        page = 'Job List';
                      }
                    }
                    if (page === 'Unknown' && log.field === 'stock') {
                      if (typeof log.oldValue === 'number' && typeof log.newValue === 'number') {
                        if (log.oldValue > log.newValue) {
                          page = 'Job List';
                        }
                      }
                    }
                    return page === 'Job List';
                  })()).map((log, idx) => (
                    <tr key={idx}>
                      <td>{log.entityName || log.productName || '-'}</td>
                      <td>{log.oldValue}</td>
                      <td>{log.newValue}</td>
                      <td>{log.changedBy}</td>
                      <td>{log.changedAt ? new Date(log.changedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : filter === 'excelUploads' ? (
        excelUploadsLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`product-table${darkMode ? ' dark' : ''}`} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Uploaded By</th>
                  <th>Products Processed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excelUploads.length === 0 ? (
                  <tr><td colSpan={4}>No Excel uploads found.</td></tr>
                ) : (
                  excelUploads.map((upload, idx) => (
                    <tr key={idx}>
                      <td>{upload.filename || 'N/A'}</td>
                      <td>{upload.uploadedBy || 'N/A'}</td>
                      <td>{upload.products ? upload.products.length : 0}</td>
                      <td>
                        <details>
                          <summary>View Details</summary>
                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                            {upload.products && upload.products.length > 0 ? (
                              <table style={{ width: '100%', fontSize: '12px' }}>
                                <thead>
                                  <tr>
                                    <th>GRN</th>
                                    <th>Item Name</th>
                                    <th>Action</th>
                                    <th>Created At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {upload.products.map((product, productIdx) => {
                                    // Find the corresponding product from the products list to get createdAt
                                    const productDetails = products.find(p => p.itemName === product.itemName || p.itemCode === product.itemCode);
                                    return (
                                      <tr key={productIdx}>
                                        <td>{product.itemCode || 'N/A'}</td>
                                        <td>{product.itemName || 'N/A'}</td>
                                        <td>{product.action || 'N/A'}</td>
                                        <td>
                                          {productDetails && productDetails.createdAt 
                                            ? new Date(productDetails.createdAt).toLocaleString() 
                                            : 'N/A'
                                          }
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            ) : (
                              <p>No product details available</p>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
};

export default LogHistoryPage; 