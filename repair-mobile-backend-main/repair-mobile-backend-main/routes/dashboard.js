const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const ProductRepair = require("../models/ProductRepair");

router.get("/", async (req, res) => {
  try {
    console.log("Fetching dashboard data...");

    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    console.log("Start of Day:", startOfDay, "End of Day:", endOfDay);

    // Fetch daily payments with populated product details
    const dailyPayments = await Payment.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("items.productId");

    console.log("Daily Payments:", dailyPayments.length);

    let dailyIncome = 0, dailyCost = 0;

    // Calculate daily income and cost
    dailyPayments.forEach((payment) => {
      payment.items.forEach((item) => {
        if (item.productId) { // Ensure product exists
          dailyIncome += item.price * item.quantity;
          dailyCost += item.productId.buyingPrice * item.quantity;
        } else {
          console.warn("Missing productId for item:", item);
        }
      });
    });

    const dailyProfit = dailyIncome - dailyCost;

    console.log(`Daily Income: Rs. ${dailyIncome}, Daily Cost: Rs. ${dailyCost}, Daily Profit: Rs. ${dailyProfit}`);

    // Fetch repair job counts
    const completedJobs = await ProductRepair.countDocuments({ repairStatus: "Completed" });
    const pendingJobs = await ProductRepair.countDocuments({ repairStatus: "Pending" });
    const inProgressJobs = await ProductRepair.countDocuments({ repairStatus: "In Progress" });

    console.log(`Completed Jobs: ${completedJobs}, Pending Jobs: ${pendingJobs}, In Progress Jobs: ${inProgressJobs}`);

    // ---- Fetch 6-Month Data ----
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate);
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5); // Start 6 months back from current month
    sixMonthsAgo.setDate(1); // Start from the 1st of the month to avoid partial months
    sixMonthsAgo.setHours(0, 0, 0, 0);

    console.log("Fetching data from:", sixMonthsAgo);

    const sixMonthPayments = await Payment.find({
      createdAt: { $gte: sixMonthsAgo },
    }).populate("items.productId");

    console.log("Six-Month Payments:", sixMonthPayments.length);

    // Initialize arrays for 6 months
    const months = [];
    const sixMonthIncome = new Array(6).fill(0);
    const sixMonthCost = new Array(6).fill(0);
    const sixMonthProfit = new Array(6).fill(0);

    // Generate the last 6 months in order
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(sixMonthsAgo.getMonth() + i);
      months.push(monthDate.toLocaleString("default", { month: "short", year: "numeric" })); // e.g., "Oct 2024"

      // Define the start and end of the current month
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Filter payments for this specific month
      sixMonthPayments.forEach((payment) => {
        const paymentDate = payment.createdAt;
        if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
          payment.items.forEach((item) => {
            if (item.productId) {
              sixMonthIncome[i] += item.price * item.quantity;
              sixMonthCost[i] += item.productId.buyingPrice * item.quantity;
            }
          });
        }
      });

      sixMonthProfit[i] = sixMonthIncome[i] - sixMonthCost[i];

      console.log(
        `Month: ${months[i]}, Income: Rs. ${sixMonthIncome[i]}, Cost: Rs. ${sixMonthCost[i]}, Profit: Rs. ${sixMonthProfit[i]}`
      );
    }

    res.json({
      dailyIncome,
      dailyCost,
      dailyProfit,
      completedJobs,
      pendingJobs,
      inProgressJobs,
      sixMonthMonths: months,
      sixMonthIncome,
      sixMonthCost,
      sixMonthProfit,
    });

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;