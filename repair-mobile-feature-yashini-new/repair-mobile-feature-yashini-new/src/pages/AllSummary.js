import React, { useState, useEffect } from 'react';
import '../styles/PaymentTable.css';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';

const PRODUCTS_API_URL = 'http://localhost:5002/api/products';
const SUPPLIERS_API_URL = 'http://localhost:5002/api/suppliers';
const PRODUCTS_REPAIR_API_URL = 'http://localhost:5002/api/productsRepair';
const SALARIES_API_URL = 'http://localhost:5002/api/salaries';
const MAINTENANCE_API_URL = 'http://localhost:5002/api/maintenance';
const EXTRA_INCOME_API_URL = 'http://localhost:5002/api/extra-income';

const AllSummary = ({ darkMode }) => {
  // State for expenses
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [grnExpenses, setGrnExpenses] = useState({ raw: [] });
  const [filteredGrnExpenses, setFilteredGrnExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [filteredSalaries, setFilteredSalaries] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [filteredMaintenance, setFilteredMaintenance] = useState([]);

  // State for income
  const [repairs, setRepairs] = useState([]);
  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [extraIncome, setExtraIncome] = useState([]);
  const [filteredExtraIncome, setFilteredExtraIncome] = useState([]);

  // Common filter state
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateField, setDateField] = useState('createdAt');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'expenses', 'income'

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterProducts();
    filterGrnExpenses();
    filterSalaries();
    filterMaintenance();
    filterRepairs();
    filterExtraIncome();
    // eslint-disable-next-line
  }, [products, grnExpenses.raw, salaries, maintenance, repairs, extraIncome, filterType, filterDate, startDate, endDate, dateField, categoryFilter, statusFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, suppliersRes, repairsRes, salariesRes, maintenanceRes, extraIncomeRes] = await Promise.all([
        fetch(PRODUCTS_API_URL),
        fetch(SUPPLIERS_API_URL),
        fetch(PRODUCTS_REPAIR_API_URL),
        fetch(SALARIES_API_URL),
        fetch(MAINTENANCE_API_URL),
        fetch(EXTRA_INCOME_API_URL)
      ]);
      
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
      if (!repairsRes.ok) throw new Error('Failed to fetch repair jobs');
      if (!salariesRes.ok) throw new Error('Failed to fetch salaries');
      if (!maintenanceRes.ok) throw new Error('Failed to fetch maintenance');
      if (!extraIncomeRes.ok) throw new Error('Failed to fetch extra income');
      
      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();
      const repairsData = await repairsRes.json();
      const salariesData = await salariesRes.json();
      const maintenanceData = await maintenanceRes.json();
      const extraIncomeData = await extraIncomeRes.json();
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setRepairs(Array.isArray(repairsData) ? repairsData : []);
      setSalaries(Array.isArray(salariesData) ? salariesData : []);
      setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
      setExtraIncome(Array.isArray(extraIncomeData) ? extraIncomeData : []);

      // Fetch all GRNs for all suppliers
      const allGrns = [];
      for (const supplier of suppliersData) {
        try {
          const grnRes = await fetch(`${SUPPLIERS_API_URL}/${supplier._id}/grns`);
          if (grnRes.ok) {
            const grns = await grnRes.json();
            for (const grn of grns) {
              allGrns.push({ ...grn, supplierName: supplier.supplierName });
            }
          }
        } catch (e) { /* skip supplier if error */ }
      }
      setGrnExpenses({ raw: allGrns });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (filterType === 'all') {
      let filtered = products;
      if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
      setFilteredProducts(filtered);
      return;
    }

    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredProducts(products);
        return;
      }
      let filtered = products.filter(p => !!p[dateField]);
      if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      filtered = filtered.filter(p => {
        const d = new Date(p[dateField]);
        return d >= start && d <= end;
      });
      setFilteredProducts(filtered);
      return;
    }

    if (!filterDate) {
      setFilteredProducts(products);
      return;
    }

    const dateObj = new Date(filterDate);
    let filtered = products.filter(p => !!p[dateField]);
    if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
    
    if (filterType === 'daily') {
      filtered = filtered.filter(p => {
        return getLocalDateKey(p[dateField]) === getLocalDateKey(filterDate);
      });
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(p => {
        const d = new Date(p[dateField]);
        return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth();
      });
    } else if (filterType === 'yearly') {
      filtered = filtered.filter(p => {
        const d = new Date(p[dateField]);
        return d.getFullYear() === dateObj.getFullYear();
      });
    }
    setFilteredProducts(filtered);
  };

  const filterGrnExpenses = () => {
    if (!grnExpenses.raw) return setFilteredGrnExpenses([]);
    
    if (filterType === 'all') {
      let filtered = [];
      for (const grn of grnExpenses.raw) {
        if (Array.isArray(grn.items)) {
          for (const item of grn.items) {
            if (categoryFilter && item.category !== categoryFilter) continue;
            filtered.push({
              grnNumber: grn.grnNumber,
              supplierName: grn.supplierName,
              itemName: item.itemName,
              itemCode: item.itemCode,
              quantity: item.quantity,
              buyingPrice: item.buyingPrice,
              grnDate: grn.date,
              category: item.category
            });
          }
        }
      }
      setFilteredGrnExpenses(filtered);
      return;
    }

    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredGrnExpenses([]);
        return;
      }
      let filtered = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      for (const grn of grnExpenses.raw) {
        const grnDateObj = grn.date ? new Date(grn.date) : null;
        if (!grnDateObj || isNaN(grnDateObj.getTime())) continue;
        
        if (grnDateObj >= start && grnDateObj <= end && Array.isArray(grn.items)) {
          for (const item of grn.items) {
            if (categoryFilter && item.category !== categoryFilter) continue;
            filtered.push({
              grnNumber: grn.grnNumber,
              supplierName: grn.supplierName,
              itemName: item.itemName,
              itemCode: item.itemCode,
              quantity: item.quantity,
              buyingPrice: item.buyingPrice,
              grnDate: grn.date,
              category: item.category
            });
          }
        }
      }
      setFilteredGrnExpenses(filtered);
      return;
    }

    if (!filterDate) {
      setFilteredGrnExpenses([]);
      return;
    }

    const dateObj = new Date(filterDate);
    let filtered = [];
    for (const grn of grnExpenses.raw) {
      const grnDateObj = grn.date ? new Date(grn.date) : null;
      if (!grnDateObj || isNaN(grnDateObj.getTime())) continue;
      let match = false;
      if (filterType === 'daily') {
        match = grnDateObj.toISOString().slice(0, 10) === filterDate;
      } else if (filterType === 'monthly') {
        match = grnDateObj.getFullYear() === dateObj.getFullYear() && grnDateObj.getMonth() === dateObj.getMonth();
      } else if (filterType === 'yearly') {
        match = grnDateObj.getFullYear() === dateObj.getFullYear();
      }
      if (match && Array.isArray(grn.items)) {
        for (const item of grn.items) {
          if (categoryFilter && item.category !== categoryFilter) continue;
          filtered.push({
            grnNumber: grn.grnNumber,
            supplierName: grn.supplierName,
            itemName: item.itemName,
            itemCode: item.itemCode,
            quantity: item.quantity,
            buyingPrice: item.buyingPrice,
            grnDate: grn.date,
            category: item.category
          });
        }
      }
    }
    setFilteredGrnExpenses(filtered);
  };

  const filterSalaries = () => {
    if (filterType === 'all') {
      setFilteredSalaries(salaries);
      return;
    }

    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredSalaries(salaries);
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filtered = salaries.filter(salary => {
        const salaryDate = new Date(salary.date);
        return salaryDate >= start && salaryDate <= end;
      });
      setFilteredSalaries(filtered);
      return;
    }

    if (!filterDate) {
      setFilteredSalaries(salaries);
      return;
    }

    const dateObj = new Date(filterDate);
    let filtered = salaries.filter(salary => !!salary.date);
    
    if (filterType === 'daily') {
      filtered = filtered.filter(salary => {
        const salaryDate = getLocalDateKey(salary.date);
        const filterDateKey = getLocalDateKey(filterDate);
        return salaryDate === filterDateKey;
      });
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(salary => {
        const d = new Date(salary.date);
        return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth();
      });
    } else if (filterType === 'yearly') {
      filtered = filtered.filter(salary => {
        const d = new Date(salary.date);
        return d.getFullYear() === dateObj.getFullYear();
      });
    }
    
    setFilteredSalaries(filtered);
  };

  const filterMaintenance = () => {
    if (filterType === 'all') {
      setFilteredMaintenance(maintenance);
      return;
    }

    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredMaintenance(maintenance);
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filtered = maintenance.filter(maint => {
        const maintDate = new Date(maint.date);
        return maintDate >= start && maintDate <= end;
      });
      setFilteredMaintenance(filtered);
      return;
    }

    if (!filterDate) {
      setFilteredMaintenance(maintenance);
      return;
    }

    const dateObj = new Date(filterDate);
    let filtered = maintenance.filter(maint => !!maint.date);
    
    if (filterType === 'daily') {
      filtered = filtered.filter(maint => {
        const maintDate = getLocalDateKey(maint.date);
        const filterDateKey = getLocalDateKey(filterDate);
        return maintDate === filterDateKey;
      });
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(maint => {
        const d = new Date(maint.date);
        return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth();
      });
    } else if (filterType === 'yearly') {
      filtered = filtered.filter(maint => {
        const d = new Date(maint.date);
        return d.getFullYear() === dateObj.getFullYear();
      });
    }
    
    setFilteredMaintenance(filtered);
  };

  const filterRepairs = () => {
    if (filterType === 'all') {
      let filtered = repairs;
      if (statusFilter) {
        filtered = filtered.filter(r => r.repairStatus === statusFilter);
      }
      setFilteredRepairs(filtered);
      return;
    }

    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredRepairs(repairs);
        return;
      }
      let filtered = repairs.filter(r => !!r[dateField]);
      
      if (statusFilter) {
        filtered = filtered.filter(r => r.repairStatus === statusFilter);
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      filtered = filtered.filter(r => {
        const d = new Date(r[dateField]);
        return d >= start && d <= end;
      });
      
      setFilteredRepairs(filtered);
      return;
    }

    if (!filterDate) {
      setFilteredRepairs(repairs);
      return;
    }

    const dateObj = new Date(filterDate);
    let filtered = repairs.filter(r => !!r[dateField]);
    
    if (statusFilter) {
      filtered = filtered.filter(r => r.repairStatus === statusFilter);
    }
    
    if (filterType === 'daily') {
      filtered = filtered.filter(r => {
        const repairDate = getLocalDateKey(r[dateField]);
        const filterDateKey = getLocalDateKey(filterDate);
        return repairDate === filterDateKey;
      });
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(r => {
        const d = new Date(r[dateField]);
        return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth();
      });
    } else if (filterType === 'yearly') {
      filtered = filtered.filter(r => {
        const d = new Date(r[dateField]);
        return d.getFullYear() === dateObj.getFullYear();
      });
    }
    
    setFilteredRepairs(filtered);
  };

  const filterExtraIncome = () => {
    if (filterType === 'all') {
      setFilteredExtraIncome(extraIncome);
      return;
    }
    if (filterType === 'range') {
      if (!startDate || !endDate) {
        setFilteredExtraIncome(extraIncome);
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      setFilteredExtraIncome(extraIncome.filter(ei => {
        const d = new Date(ei.date);
        return d >= start && d <= end;
      }));
      return;
    }
    if (!filterDate) {
      setFilteredExtraIncome(extraIncome);
      return;
    }
    const dateObj = new Date(filterDate);
    let filtered = extraIncome.filter(ei => !!ei.date);
    if (filterType === 'daily') {
      filtered = filtered.filter(ei => getLocalDateKey(ei.date) === getLocalDateKey(filterDate));
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(ei => {
        const d = new Date(ei.date);
        return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth();
      });
    } else if (filterType === 'yearly') {
      filtered = filtered.filter(ei => {
        const d = new Date(ei.date);
        return d.getFullYear() === dateObj.getFullYear();
      });
    }
    setFilteredExtraIncome(filtered);
  };

  // Collect all categories from products and GRNs
  const allCategories = Array.from(new Set([
    ...products.map(p => p.category),
    ...(grnExpenses.raw ? grnExpenses.raw.flatMap(grn => grn.items.map(i => i.category)) : [])
  ].filter(Boolean)));

  // Collect all statuses from repairs
  const allStatuses = Array.from(new Set(
    repairs.map(r => r.repairStatus).filter(Boolean)
  ));

  const getLocalDateKey = (dateString) => {
    if (!dateString) return 'Unknown';
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const calculateCartTotal = (cart) => {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0);
  };

  // Calculate totals
  const totalProductExpenses = filteredProducts.reduce((sum, product) => {
    return sum + (product.buyingPrice && product.stock ? product.buyingPrice * product.stock : 0);
  }, 0);

  const totalSalaryExpenses = filteredSalaries.reduce((sum, salary) => {
    return sum + (salary.advance || 0);
  }, 0);

  const totalMaintenanceExpenses = filteredMaintenance.reduce((sum, maint) => {
    return sum + (maint.price || 0);
  }, 0);

  const totalExtraIncome = filteredExtraIncome.reduce((sum, ei) => sum + (ei.amount || 0), 0);

  const totalExpenses = totalProductExpenses + totalSalaryExpenses + totalMaintenanceExpenses;

  const totalIncome = filteredRepairs.reduce((sum, repair) => {
    return sum + (repair.finalAmount || repair.totalRepairCost || 0);
  }, 0) + totalExtraIncome;

  const totalCheckingCharges = filteredRepairs.reduce((sum, repair) => {
    return sum + (repair.checkingCharge || 0);
  }, 0);

  const totalCartCosts = filteredRepairs.reduce((sum, repair) => {
    return sum + calculateCartTotal(repair.repairCart);
  }, 0);

  const netProfit = totalIncome - totalCartCosts;
  const netCashFlow = totalIncome - totalExpenses;

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Helper to style and autofit a worksheet
    function styleSheet(ws, data) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) {
          cell.s = cell.s || {};
          cell.s.font = { bold: true };
        }
      }
      const cols = Object.keys(data[0] || {}).map((key, i) => {
        const maxLen = Math.max(
          key.length,
          ...data.map(row => (row[key] ? String(row[key]).length : 0))
        );
        return { wch: maxLen + 2 };
      });
      ws['!cols'] = cols;
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    }

    // Generate sheet name based on current filters
    let sheetName = 'Summary';
    if (filterType !== 'all') {
      if (filterType === 'daily' && filterDate) {
        const date = new Date(filterDate);
        sheetName = `Summary_${date.toLocaleDateString('en-GB').replace(/\//g, '-')}`;
      } else if (filterType === 'monthly' && filterDate) {
        const date = new Date(filterDate);
        sheetName = `Summary_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (filterType === 'yearly' && filterDate) {
        sheetName = `Summary_${filterDate}`;
      } else if (filterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        sheetName = `Summary_${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
      }
    }
    
    // Add category filter if present (truncate if too long)
    if (categoryFilter) {
      const categorySuffix = `_${categoryFilter}`;
      if (sheetName.length + categorySuffix.length <= 31) {
        sheetName += categorySuffix;
      } else {
        // Truncate category name to fit
        const maxCategoryLength = 31 - sheetName.length - 1; // -1 for underscore
        if (maxCategoryLength > 0) {
          sheetName += `_${categoryFilter.slice(0, maxCategoryLength)}`;
        }
      }
    }
    
    // Add status filter if present (truncate if too long)
    if (statusFilter) {
      const statusSuffix = `_${statusFilter}`;
      if (sheetName.length + statusSuffix.length <= 31) {
        sheetName += statusSuffix;
      } else {
        // Truncate status name to fit
        const maxStatusLength = 31 - sheetName.length - 1; // -1 for underscore
        if (maxStatusLength > 0) {
          sheetName += `_${statusFilter.slice(0, maxStatusLength)}`;
        }
      }
    }
    
    // Final safety check - ensure sheet name doesn't exceed 31 characters
    if (sheetName.length > 31) {
      sheetName = sheetName.slice(0, 31);
    }

    // Overview Summary Sheet with filtered data
    const overviewData = [
      {
        'Metric': 'Total Income',
        'Amount (Rs.)': `Rs. ${totalIncome.toFixed(2)}`
      },
      {
        'Metric': 'Extra Income',
        'Amount (Rs.)': `Rs. ${totalExtraIncome.toFixed(2)}`
      },
      {
        'Metric': 'Total Expenses',
        'Amount (Rs.)': `Rs. ${totalExpenses.toFixed(2)}`
      },
      {
        'Metric': 'Product Expenses',
        'Amount (Rs.)': `Rs. ${totalProductExpenses.toFixed(2)}`
      },
      {
        'Metric': 'Salary Expenses',
        'Amount (Rs.)': `Rs. ${totalSalaryExpenses.toFixed(2)}`
      },
      {
        'Metric': 'Maintenance Expenses',
        'Amount (Rs.)': `Rs. ${totalMaintenanceExpenses.toFixed(2)}`
      },
      {
        'Metric': 'Checking Charges',
        'Amount (Rs.)': `Rs. ${totalCheckingCharges.toFixed(2)}`
      },
      {
        'Metric': 'Parts Cost',
        'Amount (Rs.)': `Rs. ${totalCartCosts.toFixed(2)}`
      },
      {
        'Metric': 'Net Profit',
        'Amount (Rs.)': `Rs. ${netProfit.toFixed(2)}`
      },
      {
        'Metric': 'Net Cash Flow',
        'Amount (Rs.)': `Rs. ${netCashFlow.toFixed(2)}`
      }
    ];

    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    styleSheet(overviewSheet, overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, sheetName);

    XLSX.writeFile(workbook, `${sheetName}.xlsx`);
  };

  return (
    <div className={`product-list-container ${darkMode ? 'dark' : ''}`}> 
      <h2 className="product-list-title">All Summary</h2>
      
      {!loading && !error && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '10px', 
          marginBottom: '10px', 
          borderRadius: '5px',
          border: '1px solid #28a745',
          fontSize: '14px'
        }}>
          <strong>Data Status:</strong> Found {products.length} products, {salaries.length} salaries, {maintenance.length} maintenance bills, {repairs.length} repair jobs | 
          Showing {filteredProducts.length} filtered products, {filteredSalaries.length} filtered salaries, {filteredMaintenance.length} filtered maintenance, {filteredRepairs.length} filtered repairs
        </div>
      )}

      {/* Filter Controls */}
      <div style={{ 
        marginBottom: 20,
        color: darkMode ? '#e2e8f0' : '#333'
      }}>
        <label style={{ color: darkMode ? '#e2e8f0' : '#333' }}>Filter: </label>
        <select 
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
          style={{
            backgroundColor: darkMode ? '#374151' : '#fff',
            color: darkMode ? '#e2e8f0' : '#333',
            border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
            borderRadius: '4px',
            padding: '4px 8px'
          }}
        >
          <option value="all">All</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="range">Date Range</option>
        </select>
        {filterType === 'range' ? (
          <div style={{ display: 'inline-block', marginLeft: 10 }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ 
                marginRight: 10,
                width: 150,
                backgroundColor: darkMode ? '#374151' : '#fff',
                color: darkMode ? '#e2e8f0' : '#333',
                border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
              placeholder="Start Date"
            />
            <span style={{ color: darkMode ? '#e2e8f0' : '#333', marginRight: 10 }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ 
                width: 150,
                backgroundColor: darkMode ? '#374151' : '#fff',
                color: darkMode ? '#e2e8f0' : '#333',
                border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
              placeholder="End Date"
            />
          </div>
        ) : filterType !== 'all' && (
          <input
            type={filterType === 'yearly' ? 'number' : filterType === 'monthly' ? 'month' : 'date'}
            value={filterType === 'monthly' ? filterDate.slice(0, 7) : filterDate}
            onChange={e => {
              if (filterType === 'monthly') {
                setFilterDate(e.target.value ? e.target.value + '-01' : '');
              } else {
                setFilterDate(e.target.value);
              }
            }}
            min={filterType === 'monthly' ? '2000-01' : '2000-01-01'}
            style={{ 
              marginLeft: 10, 
              width: 160,
              backgroundColor: darkMode ? '#374151' : '#fff',
              color: darkMode ? '#e2e8f0' : '#333',
              border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
              borderRadius: '4px',
              padding: '4px 8px'
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 20 }}>
          <label style={{ 
            marginRight: 10,
            color: darkMode ? '#e2e8f0' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <input
              type="radio"
              name="dateField"
              value="createdAt"
              checked={dateField === 'createdAt'}
              onChange={() => setDateField('createdAt')}
              style={{ margin: 0 }}
            />
            Created Date
          </label>
          <label style={{ 
            color: darkMode ? '#e2e8f0' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <input
              type="radio"
              name="dateField"
              value="updatedAt"
              checked={dateField === 'updatedAt'}
              onChange={() => setDateField('updatedAt')}
              style={{ margin: 0 }}
            />
            Last Updated
          </label>
        </div>
        <br/>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label style={{ 
            color: darkMode ? '#e2e8f0' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            Category: 
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)} 
              style={{ 
                marginLeft: 5,
                backgroundColor: darkMode ? '#374151' : '#fff',
                color: darkMode ? '#e2e8f0' : '#333',
                border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
            >
              <option value="">All</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label style={{ 
            color: darkMode ? '#e2e8f0' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            Status: 
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              style={{ 
                marginLeft: 5,
                backgroundColor: darkMode ? '#374151' : '#fff',
                color: darkMode ? '#e2e8f0' : '#333',
                border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
            >
              <option value="">All</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <button className="btn-report" onClick={handleExportExcel}>
            <FontAwesomeIcon icon={faFileExcel} className="report-btn-icon" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'overview' ? '#007bff' : (darkMode ? '#374151' : '#f8f9fa'),
            color: activeTab === 'overview' ? 'white' : (darkMode ? '#e2e8f0' : '#333'),
            border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'expenses' ? '#dc3545' : (darkMode ? '#374151' : '#f8f9fa'),
            color: activeTab === 'expenses' ? 'white' : (darkMode ? '#e2e8f0' : '#333'),
            border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'income' ? '#28a745' : (darkMode ? '#374151' : '#f8f9fa'),
            color: activeTab === 'income' ? 'white' : (darkMode ? '#e2e8f0' : '#333'),
            border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Income
        </button>
        <button 
          onClick={() => setActiveTab('extraIncome')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'extraIncome' ? '#17a2b8' : (darkMode ? '#374151' : '#f8f9fa'),
            color: activeTab === 'extraIncome' ? 'white' : (darkMode ? '#e2e8f0' : '#333'),
            border: darkMode ? '1px solid #4a5568' : '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Extra Income
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <p className="error-message" style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Total Income</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                    Rs. {totalIncome.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Extra Income</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#17a2b8' }}>
                    Rs. {totalExtraIncome.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Total Expenses</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
                    Rs. {totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Product Expenses</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ff6b35' }}>
                    Rs. {totalProductExpenses.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Salary Expenses</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#6f42c1' }}>
                    Rs. {totalSalaryExpenses.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Maintenance Expenses</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fd7e14' }}>
                    Rs. {totalMaintenanceExpenses.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Checking Charges</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                    Rs. {totalCheckingCharges.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Parts Cost</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>
                    Rs. {totalCartCosts.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Net Profit</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                    Rs. {netProfit.toFixed(2)}
                  </p>
                </div>
                <div style={{ 
                  background: darkMode ? '#2a2a2a' : '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  minWidth: '200px',
                  border: darkMode ? '1px solid #444' : '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#fff' : '#333' }}>Net Cash Flow</h4>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: netCashFlow >= 0 ? '#28a745' : '#dc3545' }}>
                    Rs. {netCashFlow.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Summary Table */}
              <table className={`product-table ${darkMode ? 'dark' : ''}`}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Income</td>
                    <td style={{ color: '#28a745', fontWeight: 'bold' }}>Rs. {totalIncome.toFixed(2)}</td>
                    <td>Total revenue from repair jobs and extra income</td>
                  </tr>
                  <tr>
                    <td>Extra Income</td>
                    <td style={{ color: '#17a2b8', fontWeight: 'bold' }}>Rs. {totalExtraIncome.toFixed(2)}</td>
                    <td>Other income (not from repairs)</td>
                  </tr>
                  <tr>
                    <td>Total Expenses</td>
                    <td style={{ color: '#dc3545', fontWeight: 'bold' }}>Rs. {totalExpenses.toFixed(2)}</td>
                    <td>Total of all expenses (products + salaries + maintenance)</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '20px' }}>• Product Expenses</td>
                    <td style={{ color: '#ff6b35', fontWeight: 'bold' }}>Rs. {totalProductExpenses.toFixed(2)}</td>
                    <td>Cost of products, parts, and stock</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '20px' }}>• Salary Expenses</td>
                    <td style={{ color: '#6f42c1', fontWeight: 'bold' }}>Rs. {totalSalaryExpenses.toFixed(2)}</td>
                    <td>Employee salary advances and payments</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '20px' }}>• Maintenance Expenses</td>
                    <td style={{ color: '#fd7e14', fontWeight: 'bold' }}>Rs. {totalMaintenanceExpenses.toFixed(2)}</td>
                    <td>Service bills and maintenance costs</td>
                  </tr>
                  <tr>
                    <td>Checking Charges</td>
                    <td style={{ color: '#007bff', fontWeight: 'bold' }}>Rs. {totalCheckingCharges.toFixed(2)}</td>
                    <td>Diagnostic charges collected</td>
                  </tr>
                  <tr>
                    <td>Parts Cost</td>
                    <td style={{ color: '#ffc107', fontWeight: 'bold' }}>Rs. {totalCartCosts.toFixed(2)}</td>
                    <td>Cost of parts used in repairs</td>
                  </tr>
                  <tr>
                    <td>Net Profit</td>
                    <td style={{ color: '#28a745', fontWeight: 'bold' }}>Rs. {netProfit.toFixed(2)}</td>
                    <td>Income minus parts cost</td>
                  </tr>
                  <tr>
                    <td>Net Cash Flow</td>
                    <td style={{ color: netCashFlow >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                      Rs. {netCashFlow.toFixed(2)}
                    </td>
                    <td>Income minus total expenses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <table className={`product-table ${darkMode ? 'dark' : ''}`}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Amount (Expense)</th>
                  <th>Description</th>
                  <th>Category/Service</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 && filteredSalaries.length === 0 && filteredMaintenance.length === 0 ? (
                  <tr><td colSpan={6} className="no-products">No expenses found.</td></tr>
                ) : (
                  <>
                    {/* Product Expenses */}
                    {filteredProducts.map((p, idx) => (
                      <tr key={`product-${p._id || idx}`}>
                        <td>Product</td>
                        <td>{p.itemCode || '-'}</td>
                        <td>Rs. {p.buyingPrice && p.stock ? (p.buyingPrice * p.stock).toFixed(2) : '-'}</td>
                        <td>{p.itemName || '-'}</td>
                        <td>{p.category || '-'}</td>
                        <td>{getLocalDateKey(p.createdAt)}</td>
                      </tr>
                    ))}
                    {/* Salary Expenses */}
                    {filteredSalaries.map((s, idx) => (
                      <tr key={`salary-${s._id || idx}`}>
                        <td>Salary</td>
                        <td>{s.employeeId || '-'}</td>
                        <td>Rs. {(s.advance || 0).toFixed(2)}</td>
                        <td>{s.employeeName || '-'}</td>
                        <td>Salary Advance</td>
                        <td>{getLocalDateKey(s.date)}</td>
                      </tr>
                    ))}
                    {/* Maintenance Expenses */}
                    {filteredMaintenance.map((m, idx) => (
                      <tr key={`maintenance-${m._id || idx}`}>
                        <td>Maintenance</td>
                        <td>{m.no || '-'}</td>
                        <td>Rs. {(m.price || 0).toFixed(2)}</td>
                        <td>{m.remarks || '-'}</td>
                        <td>{m.serviceType || '-'}</td>
                        <td>{getLocalDateKey(m.date)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}

          {/* Income Tab */}
          {activeTab === 'income' && (
            <table className={`product-table ${darkMode ? 'dark' : ''}`}>
              <thead>
                <tr>
                  <th>Job Number</th>
                  <th>Customer Name</th>
                  <th>Device Type</th>
                  <th>Issue Description</th>
                  <th>Checking Charge</th>
                  <th>Cart Total</th>
                  <th>Total Repair Cost</th>
                  <th>Final Amount</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.length === 0 ? (
                  <tr><td colSpan={11} className="no-products">No income found.</td></tr>
                ) : (
                  filteredRepairs.map((r, idx) => (
                    <tr key={r._id || idx}>
                      <td>{r.repairInvoice || r.repairCode || '-'}</td>
                      <td>{r.customerName || '-'}</td>
                      <td>{r.deviceType || r.itemName || '-'}</td>
                      <td>{r.issueDescription || '-'}</td>
                      <td>Rs. {(r.checkingCharge || 0).toFixed(2)}</td>
                      <td>Rs. {calculateCartTotal(r.repairCart).toFixed(2)}</td>
                      <td>Rs. {(r.totalRepairCost || 0).toFixed(2)}</td>
                      <td>Rs. {(r.finalAmount || r.totalRepairCost || 0).toFixed(2)}</td>
                      <td>{r.repairStatus || '-'}</td>
                      <td>{getLocalDateKey(r.createdAt)}</td>
                      <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Extra Income Tab */}
          {activeTab === 'extraIncome' && (
            <table className={`product-table ${darkMode ? 'dark' : ''}`}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Income Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredExtraIncome.length === 0 ? (
                  <tr><td colSpan={4} className="no-products">No extra income found.</td></tr>
                ) : (
                  filteredExtraIncome.map((ei, idx) => (
                    <tr key={ei._id || idx}>
                      <td>{ei.date ? new Date(ei.date).toLocaleDateString() : '-'}</td>
                      <td>Rs. {(ei.amount || 0).toFixed(2)}</td>
                      <td>{ei.incomeType || '-'}</td>
                      <td>{ei.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default AllSummary; 