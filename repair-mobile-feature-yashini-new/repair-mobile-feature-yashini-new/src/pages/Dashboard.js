import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Highcharts from "highcharts";
import "highcharts/highcharts-3d";
import HighchartsReact from "highcharts-react-official";
import incomeIcon from "../icon/add-to-basket1 (2).png";
import costIcon from "../icon/8.png";
import profitIcon from "../icon/2.png";
import sucessIcon from "../icon/sucess.png";
import warningIcon from "../icon/warning.png";
import repairingIcon from "../icon/repairing.png";
import { FaChartLine, FaArrowUp, FaArrowDown, FaCheckCircle, FaClock, FaTools } from "react-icons/fa";
import "../styles/Dashboard.css";

const API_URL = "http://localhost:5002/api/dashboard";
const PRODUCTS_REPAIR_API_URL = 'http://localhost:5002/api/productsRepair';
const EXTRA_INCOME_API_URL = 'http://localhost:5002/api/extra-income';
const SALARIES_API_URL = 'http://localhost:5002/api/salaries';
const MAINTENANCE_API_URL = 'http://localhost:5002/api/maintenance';

// Sample data for demonstration
const sampleData = {
  dailyIncome: 125000,
  dailyCost: 85000,
  dailyProfit: 40000,
  completedJobs: 10,
  pendingJobs: 5,
  inProgressJobs: 8,
  sixMonthMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  sixMonthIncome: [98000, 112000, 125000, 118000, 135000, 142000],
  sixMonthCost: [72000, 85000, 92000, 88000, 95000, 98000],
  sixMonthProfit: [26000, 27000, 33000, 30000, 40000, 44000]
};

const Dashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const [dailyData, setDailyData] = useState({ income: 0, cost: 0, profit: 0 });
  const [jobData, setJobData] = useState({ completed: 0, pending: 0, inProgress: 0 });
  const [sixMonthData, setSixMonthData] = useState({ months: [], income: [], cost: [], profit: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [repairsData, setRepairsData] = useState([]);
  const [extraIncomeData, setExtraIncomeData] = useState([]);
  const [salariesData, setSalariesData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPartsCost, setTotalPartsCost] = useState(0);
  const [totalNetProfit, setTotalNetProfit] = useState(0);

  const isDarkMode = darkMode;

  // Get user name from localStorage
  const getUserName = () => {
    const cashierName = localStorage.getItem('cashierName');
    const userName = localStorage.getItem('userName');
    const username = localStorage.getItem('username');
    return cashierName || userName || username || 'User';
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTotalIncome();
    fetchTodayIncomeData();
    fetchTodayExpensesData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        // If API is not available, use sample data
        setIsDemoMode(true);
        setDailyData({ 
          income: sampleData.dailyIncome, 
          cost: sampleData.dailyCost, 
          profit: sampleData.dailyProfit 
        });
        setJobData({
          completed: sampleData.completedJobs,
          pending: sampleData.pendingJobs,
          inProgress: sampleData.inProgressJobs
        });
        setSixMonthData({
          months: sampleData.sixMonthMonths,
          income: sampleData.sixMonthIncome,
          cost: sampleData.sixMonthCost,
          profit: sampleData.sixMonthProfit,
        });
        setLastUpdated(new Date().toLocaleTimeString());
        console.log("API not available, using demo data");
        return;
      }
      
      const data = await response.json();
      console.log("Backend data received:", data);
      
      // Ensure we have valid data from backend
      if (data && (data.dailyIncome !== undefined || data.sixMonthIncome !== undefined)) {
        setIsDemoMode(false);
        setDailyData({ 
          income: data.dailyIncome || 0, 
          cost: data.dailyCost || 0, 
          profit: data.dailyProfit || 0 
        });
        setJobData({
          completed: data.completedJobs || 0,
          pending: data.pendingJobs || 0,
          inProgress: data.inProgressJobs || 0
        });
        setSixMonthData({
          months: data.sixMonthMonths || sampleData.sixMonthMonths,
          income: data.sixMonthIncome || sampleData.sixMonthIncome,
          cost: data.sixMonthCost || sampleData.sixMonthCost,
          profit: data.sixMonthProfit || sampleData.sixMonthProfit,
        });
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        // If backend data is incomplete, use sample data
        setIsDemoMode(true);
        setDailyData({ 
          income: sampleData.dailyIncome, 
          cost: sampleData.dailyCost, 
          profit: sampleData.dailyProfit 
        });
        setJobData({
          completed: sampleData.completedJobs,
          pending: sampleData.pendingJobs,
          inProgress: sampleData.inProgressJobs
        });
        setSixMonthData({
          months: sampleData.sixMonthMonths,
          income: sampleData.sixMonthIncome,
          cost: sampleData.sixMonthCost,
          profit: sampleData.sixMonthProfit,
        });
        setLastUpdated(new Date().toLocaleTimeString());
        console.log("Backend data incomplete, using demo data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Use sample data if API fails
      setIsDemoMode(true);
      setDailyData({ 
        income: sampleData.dailyIncome, 
        cost: sampleData.dailyCost, 
        profit: sampleData.dailyProfit 
      });
      setJobData({
        completed: sampleData.completedJobs,
        pending: sampleData.pendingJobs,
        inProgress: sampleData.inProgressJobs
      });
      setSixMonthData({
        months: sampleData.sixMonthMonths,
        income: sampleData.sixMonthIncome,
        cost: sampleData.sixMonthCost,
        profit: sampleData.sixMonthProfit,
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // Fetch and calculate total income (all time)
  const fetchTotalIncome = async () => {
    try {
      const [repairsRes, extraIncomeRes, salariesRes, maintenanceRes] = await Promise.all([
        fetch(PRODUCTS_REPAIR_API_URL),
        fetch(EXTRA_INCOME_API_URL),
        fetch(SALARIES_API_URL),
        fetch(MAINTENANCE_API_URL)
      ]);
      let repairs = [];
      let extraIncomes = [];
      let salaries = [];
      let maintenance = [];
      if (repairsRes.ok) repairs = await repairsRes.json();
      if (extraIncomeRes.ok) extraIncomes = await extraIncomeRes.json();
      if (salariesRes.ok) salaries = await salariesRes.json();
      if (maintenanceRes.ok) maintenance = await maintenanceRes.json();
      // All-time income
      const repairsTotal = Array.isArray(repairs)
        ? repairs.reduce((sum, r) => sum + (r.finalAmount || r.totalRepairCost || 0), 0)
        : 0;
      const extraIncomeTotal = Array.isArray(extraIncomes)
        ? extraIncomes.reduce((sum, ei) => sum + (ei.amount || 0), 0)
        : 0;
      setTotalIncome(repairsTotal + extraIncomeTotal);
      // All-time parts cost
      const calculateCartTotal = (cart) => {
        if (!cart || !Array.isArray(cart)) return 0;
        return cart.reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0);
      };
      const allPartsCost = Array.isArray(repairs)
        ? repairs.reduce((sum, r) => sum + calculateCartTotal(r.repairCart), 0)
        : 0;
      setTotalPartsCost(allPartsCost);
      // All-time salary expenses
      const allSalaryTotal = Array.isArray(salaries)
        ? salaries.reduce((sum, s) => sum + (s.advance || 0), 0)
        : 0;
      // All-time maintenance expenses
      const allMaintenanceTotal = Array.isArray(maintenance)
        ? maintenance.reduce((sum, m) => sum + (m.price || 0), 0)
        : 0;
      // All-time total expenses
      setTotalExpenses(allPartsCost + allSalaryTotal + allMaintenanceTotal);
      // All-time net profit (income - parts cost)
      setTotalNetProfit(repairsTotal + extraIncomeTotal - allPartsCost);
    } catch (err) {
      setTotalIncome(0);
      setTotalPartsCost(0);
      setTotalExpenses(0);
      setTotalNetProfit(0);
    }
  };

  // Fetch all repairs and extra income for today calculation
  const fetchTodayIncomeData = async () => {
    try {
      const [repairsRes, extraIncomeRes] = await Promise.all([
        fetch(PRODUCTS_REPAIR_API_URL),
        fetch(EXTRA_INCOME_API_URL)
      ]);
      let repairs = [];
      let extraIncomes = [];
      if (repairsRes.ok) repairs = await repairsRes.json();
      if (extraIncomeRes.ok) extraIncomes = await extraIncomeRes.json();
      setRepairsData(Array.isArray(repairs) ? repairs : []);
      setExtraIncomeData(Array.isArray(extraIncomes) ? extraIncomes : []);
      // Calculate today's total income
      const todayKey = getLocalDateKey(new Date());
      const todayRepairsTotal = repairs.filter(r => getLocalDateKey(r.createdAt) === todayKey)
        .reduce((sum, r) => sum + (r.finalAmount || r.totalRepairCost || 0), 0);
      const todayExtraIncomeTotal = extraIncomes.filter(ei => getLocalDateKey(ei.date) === todayKey)
        .reduce((sum, ei) => sum + (ei.amount || 0), 0);
      setDailyData(prev => ({ ...prev, income: todayRepairsTotal + todayExtraIncomeTotal }));
    } catch (err) {
      // fallback: do not update dailyData.income
    }
  };

  // Fetch all salaries and maintenance for today calculation
  const fetchTodayExpensesData = async () => {
    try {
      const [salariesRes, maintenanceRes, repairsRes] = await Promise.all([
        fetch(SALARIES_API_URL),
        fetch(MAINTENANCE_API_URL),
        fetch(PRODUCTS_REPAIR_API_URL)
      ]);
      let salaries = [];
      let maintenance = [];
      let repairs = [];
      if (salariesRes.ok) salaries = await salariesRes.json();
      if (maintenanceRes.ok) maintenance = await maintenanceRes.json();
      if (repairsRes.ok) repairs = await repairsRes.json();
      setSalariesData(Array.isArray(salaries) ? salaries : []);
      setMaintenanceData(Array.isArray(maintenance) ? maintenance : []);
      // Today's date key
      const todayKey = getLocalDateKey(new Date());
      // Salary expenses for today
      const todaySalaryTotal = salaries.filter(s => getLocalDateKey(s.date) === todayKey)
        .reduce((sum, s) => sum + (s.advance || 0), 0);
      // Maintenance expenses for today
      const todayMaintenanceTotal = maintenance.filter(m => getLocalDateKey(m.date) === todayKey)
        .reduce((sum, m) => sum + (m.price || 0), 0);
      // Parts cost for today's repairs
      const todayRepairs = repairs.filter(r => getLocalDateKey(r.createdAt) === todayKey);
      const calculateCartTotal = (cart) => {
        if (!cart || !Array.isArray(cart)) return 0;
        return cart.reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0);
      };
      const todayPartsCost = todayRepairs.reduce((sum, r) => sum + calculateCartTotal(r.repairCart), 0);
      // Today's total expenses
      const todayTotalExpenses = todayPartsCost + todaySalaryTotal + todayMaintenanceTotal;
      // Today's net profit (income - parts cost)
      setDailyData(prev => ({
        ...prev,
        cost: todayTotalExpenses,
        profit: prev.income - todayPartsCost
      }));
    } catch (err) {
      // fallback: do not update dailyData.cost/profit
    }
  };

  // Helper to get YYYY-MM-DD string from a date or date string
  const getLocalDateKey = (dateInput) => {
    if (!dateInput) return 'Unknown';
    const d = new Date(dateInput);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Calculate last 6 months' financial data for the chart
  const getLast6MonthsData = () => {
    // Get all repairs, extra incomes, salaries, maintenance from state
    // (these are set by fetchTotalIncome and fetchTodayExpensesData)
    const now = new Date();
    const months = [];
    const monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    // Helper to get month key from date
    const getMonthKey = (dateInput) => {
      if (!dateInput) return '';
      const d = new Date(dateInput);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    // Calculate income, cost, profit for each month
    const incomeArr = monthKeys.map(monthKey => {
      // Repairs income for this month
      const repairsIncome = repairsData.filter(r => getMonthKey(r.createdAt) === monthKey)
        .reduce((sum, r) => sum + (r.finalAmount || r.totalRepairCost || 0), 0);
      // Extra income for this month
      const extraIncome = extraIncomeData.filter(ei => getMonthKey(ei.date) === monthKey)
        .reduce((sum, ei) => sum + (ei.amount || 0), 0);
      return repairsIncome + extraIncome;
    });
    const costArr = monthKeys.map(monthKey => {
      // Parts cost for this month
      const calculateCartTotal = (cart) => {
        if (!cart || !Array.isArray(cart)) return 0;
        return cart.reduce((total, item) => total + Math.max(0, parseFloat(item.cost || 0)), 0);
      };
      const partsCost = repairsData.filter(r => getMonthKey(r.createdAt) === monthKey)
        .reduce((sum, r) => sum + calculateCartTotal(r.repairCart), 0);
      // Salary expenses for this month
      const salaryCost = salariesData.filter(s => getMonthKey(s.date) === monthKey)
        .reduce((sum, s) => sum + (s.advance || 0), 0);
      // Maintenance expenses for this month
      const maintenanceCost = maintenanceData.filter(m => getMonthKey(m.date) === monthKey)
        .reduce((sum, m) => sum + (m.price || 0), 0);
      return partsCost + salaryCost + maintenanceCost;
    });
    const profitArr = incomeArr.map((inc, i) => inc - (costArr[i] || 0));
    return { months, incomeArr, costArr, profitArr };
  };

  const { months: chartMonths, incomeArr: chartIncome, costArr: chartCost, profitArr: chartProfit } = getLast6MonthsData();

  // Helper to format large numbers with K/L suffix
  const formatShortNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toString();
  };

  const chartOptions = {
    chart: {
      type: "column",
      options3d: {
        enabled: true,
        alpha: 10,
        beta: 0,
        depth: 40,
        viewDistance: 25,
        frame: {
          bottom: { size: 1, color: isDarkMode ? "#374151" : "#e5e7eb" },
          side: { size: 0 },
          back: { size: 0 },
        },
      },
      backgroundColor: isDarkMode ? "#181f2a" : "#f8fafc",
      borderWidth: 0,
      borderRadius: 16,
      style: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      animation: true,
    },
    title: {
      text: "Financial Performance Overview",
      style: { 
        color: isDarkMode ? "#f9fafb" : "#1e293b",
        fontFamily: "'Inter', sans-serif",
        fontSize: '22px',
        fontWeight: '700',
        letterSpacing: '0.5px',
      },
      align: 'left',
      margin: 24
    },
    subtitle: {
      text: "6-Month Revenue, Expenses, and Profit Trends",
      style: { 
        color: isDarkMode ? "#9ca3af" : "#64748b",
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontWeight: '500',
      },
      align: 'left',
      y: 44
    },
    xAxis: {
      categories: chartMonths,
      labels: {
        style: {
          color: isDarkMode ? "#d1d5db" : "#334155",
          fontFamily: "'Inter', sans-serif",
          fontSize: "15px",
          fontWeight: '600'
        },
        y: 8
      },
      lineColor: isDarkMode ? "#374151" : "#e5e7eb",
      tickColor: isDarkMode ? "#374151" : "#e5e7eb",
      gridLineColor: isDarkMode ? "#232b39" : "#e5e7eb",
      gridLineWidth: 1,
    },
    yAxis: {
      title: { 
        text: "Amount (Rs.)",
        style: {
          color: isDarkMode ? "#9ca3af" : "#64748b",
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: '600'
        }
      },
      labels: {
        style: {
          color: isDarkMode ? "#d1d5db" : "#334155",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          fontWeight: '500'
        },
        formatter: function () {
          return formatShortNumber(this.value);
        },
      },
      gridLineColor: isDarkMode ? "#232b39" : "#e5e7eb",
      lineColor: isDarkMode ? "#374151" : "#e5e7eb",
      lineWidth: 1,
      min: 0,
    },
    plotOptions: {
      column: {
        depth: 25,
        groupPadding: 0.18,
        pointPadding: 0.08,
        borderRadius: 6,
        dataLabels: {
          enabled: true,
          format: "Rs. {y}",
          style: {
            color: isDarkMode ? "#f9fafb" : "#1e293b",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: '700',
            textOutline: "none",
          },
        },
        animation: {
          duration: 900
        }
      },
      series: {
        animation: {
          duration: 900
        }
      }
    },
    series: [
      {
        name: "Revenue",
        data: chartIncome,
        color: "#10b981",
        borderColor: "#059669",
        borderWidth: 2,
      },
      {
        name: "Expenses",
        data: chartCost,
        color: "#ef4444",
        borderColor: "#dc2626",
        borderWidth: 2,
      },
      {
        name: "Net Profit",
        data: chartProfit,
        color: "#3b82f6",
        borderColor: "#2563eb",
        borderWidth: 2,
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        color: isDarkMode ? "#f9fafb" : "#1e293b",
        fontFamily: "'Inter', sans-serif",
        fontSize: "15px",
        fontWeight: '600'
      },
      itemHoverStyle: {
        color: isDarkMode ? "#fbbf24" : "#0ea5e9"
      },
      symbolHeight: 16,
      symbolWidth: 16,
      symbolRadius: 8,
      margin: 16
    },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: isDarkMode ? "#232b39" : "#f1f5f9",
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      borderRadius: 10,
      style: {
        color: isDarkMode ? "#f9fafb" : "#1e293b",
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontWeight: '500'
      },
      formatter: function() {
        return `<b>${this.x}</b><br/>` +
          `<span style="color: ${this.color}">●</span> ${this.series.name}: <b>Rs. ${formatShortNumber(this.y)}</b>`;
      }
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 700
        },
        chartOptions: {
          chart: {
            marginLeft: 20,
            marginRight: 20
          },
          xAxis: {
            labels: {
              style: {
                fontSize: '12px'
              }
            }
          },
          yAxis: {
            labels: {
              style: {
                fontSize: '11px'
              }
            }
          },
          legend: {
            itemStyle: {
              fontSize: '12px'
            }
          }
        }
      }]
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cashierId');
    localStorage.removeItem('cashierName');
    navigate('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(amount).replace('INR', 'Rs.');
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <FaArrowUp className="trend-icon positive" />;
    if (value < 0) return <FaArrowDown className="trend-icon negative" />;
    return <FaChartLine className="trend-icon neutral" />;
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <main className="dashboard-main">
        {/* Header Section */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Welcome back, {getUserName()}! 👋</h1>
              <p className="dashboard-subtitle">Here's your business overview for today</p>
              {isDemoMode && (
                <div className="demo-notice">
                  <span>📊 Demo Mode - Showing sample data</span>
                </div>
              )}
            </div>
            <div className="header-right">
              {lastUpdated && (
                <div className="last-updated">
                  <span>Last updated: {lastUpdated}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-icon">⏳</div>
            </div>
            <p className="loading-text">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-content">
              <h3>Error Loading Data</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={fetchDashboardData}>
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-section">
              <h2 className="section-title">Today's Summary</h2>
              <div className="summary-grid">
                <div className="summary-card income-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper income">
                      <img src={incomeIcon} alt="Income" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(dailyData.income)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Total Revenue</h3>
                    <p className="card-amount">{formatCurrency(dailyData.income)}</p>
                    <p className="card-subtitle">Today's earnings</p>
                    <p className="card-total-income" style={{marginTop: 8, color: '#10b981', fontWeight: 500}}>
                      Total Income: {formatCurrency(totalIncome)}
                    </p>
                  </div>
                </div>

                <div className="summary-card expense-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper expense">
                      <img src={costIcon} alt="Cost" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(dailyData.cost)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Total Expenses</h3>
                    <p className="card-amount">{formatCurrency(dailyData.cost)}</p>
                    <p className="card-subtitle">Today's costs</p>
                    <p className="card-total-income" style={{marginTop: 8, color: '#ef4444', fontWeight: 500}}>
                      Total Expenses: {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>

                <div className="summary-card profit-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper profit">
                      <img src={profitIcon} alt="Profit" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(dailyData.profit)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Net Profit</h3>
                    <p className="card-amount">{formatCurrency(dailyData.profit)}</p>
                    <p className="card-subtitle">Today's profit</p>
                    <p className="card-total-income" style={{marginTop: 8, color: '#3b82f6', fontWeight: 500}}>
                      Net Profit: {formatCurrency(totalNetProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Repair Jobs Section */}
            <div className="summary-section">
              <h2 className="section-title">Repair Jobs Status</h2>
              <div className="summary-grid">
                <div className="summary-card completed-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper completed">
                      <img src={sucessIcon} alt="Completed" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(jobData.completed)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Completed Jobs</h3>
                    <p className="card-amount">{jobData.completed}</p>
                    <p className="card-subtitle">Total completed repairs</p>
                  </div>
                </div>

                <div className="summary-card pending-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper pending">
                      <img src={warningIcon} alt="Pending" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(jobData.pending)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Pending Jobs</h3>
                    <p className="card-amount">{jobData.pending}</p>
                    <p className="card-subtitle">Total pending repairs</p>
                  </div>
                </div>

                <div className="summary-card inprogress-card">
                  <div className="card-header">
                    <div className="card-icon-wrapper inprogress">
                      <img src={repairingIcon} alt="In Progress" className="card-icon" />
                    </div>
                    <div className="trend-indicator">
                      {getTrendIcon(jobData.inProgress)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">In Progress Jobs</h3>
                    <p className="card-amount">{jobData.inProgress}</p>
                    <p className="card-subtitle">Total repairs in progress</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section">
              <div className="chart-card">
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;