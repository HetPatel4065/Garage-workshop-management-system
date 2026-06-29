import Service from "../models/Service.js";
import Customer from "../models/Customer.js";
import Inventory from "../models/Inventory.js";
import Invoice from "../models/Invoice.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import Vehicle from "../models/Vehicle.js";
import mongoose from "mongoose";
import { logActivity } from "../utils/activityLogger.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const range = parseInt(req.query.range) || 7; // Default to 7 days
    const now = new Date();

    if (!ownerId) {
      return res.status(403).json({
        error: "Cannot fetch dashboard: User is not linked to a garage",
      });
    }

    // Date range calculations (Local Time)
    const formatDate = (date) => {
      const d = new Date(date);
      let month = "" + (d.getMonth() + 1);
      let day = "" + d.getDate();
      let year = d.getFullYear();
      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;
      return [year, month, day].join("-");
    };

    const todayStr = formatDate(now);

    const rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - (range - 1));
    rangeStart.setHours(0, 0, 0, 0);

    const prevRangeStart = new Date(rangeStart);
    prevRangeStart.setDate(rangeStart.getDate() - range);
    prevRangeStart.setHours(0, 0, 0, 0);

    // 1. Fetch Counts
    const activeServices = await Service.countDocuments({
      ownerId,
      status: { $in: ["Pending", "In Progress", "Completed"] }, // Exclude Cancelled/Completed if we want "Active"
    });
    // Actually, following original logic but filtering by range where appropriate
    const totalActiveServices = await Service.countDocuments({
      ownerId,
      status: { $in: ["Pending", "In Progress", "Completed", "Cancelled"] },
    });

    const newCustomers = await Customer.countDocuments({
      ownerId,
      createdAt: { $gte: rangeStart },
    });

    // Fetch Staff Counts
    const advisorCount = await Advisor.countDocuments({ ownerId });
    const mechanicCount = await Mechanic.countDocuments({ ownerId });

    // 2. Service Status Breakdown
    const serviceBreakdown = await Service.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      { $group: { _id: "$status", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
    ]);

    // 3. Aggregate Revenue (Only Paid Invoices)
    const totalRevResult = await Invoice.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(ownerId),
          status: { $in: ["Paid", "Partially Paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const totalRevenue = totalRevResult[0]?.total || 0;

    // 4. Aggregate History for the requested range (Invoiced vs Paid)
    const invoicedStats = await Invoice.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(ownerId),
          createdAt: { $gte: rangeStart },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
    ]);

    const paidStats = await Invoice.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(ownerId),
          createdAt: { $gte: rangeStart },
          status: { $in: ["Paid", "Partially Paid"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amountPaid" },
        },
      },
    ]);

    const revenueHistory = [];
    let todayInvoiced = 0;
    let todayPaid = 0;
    let todayPending = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const invoicesCreatedToday = await Invoice.find({
      ownerId,
      createdAt: { $gte: startOfToday },
      status: { $ne: "Cancelled" },
    });

    invoicesCreatedToday.forEach((inv) => {
      todayInvoiced += inv.total;
      if (inv.status === "Paid" || inv.status === "Partially Paid") {
        todayPaid += inv.amountPaid || 0;
      }
      if (inv.status !== "Paid" && inv.status !== "Cancelled") {
        todayPending += inv.total - (inv.amountPaid || 0);
      }
    });

    // Previous Payments: cash collected TODAY from invoices created BEFORE today.
    // e.g. invoice raised Apr 23 → customer pays Apr 24 → shows here.
    let previousPayments = 0;
    const prevInvoicesPaidToday = await Invoice.find({
      ownerId,
      paidAt: { $gte: startOfToday },
      createdAt: { $lt: startOfToday },
      status: { $in: ["Paid", "Partially Paid"] },
    });
    prevInvoicesPaidToday.forEach((inv) => {
      previousPayments += inv.amountPaid || 0;
    });

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = formatDate(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const iStat = invoicedStats.find((s) => s._id === dayStr);
      const pStat = paidStats.find((s) => s._id === dayStr);

      let dayInvoiced = iStat ? iStat.total : 0;
      let dayPaid = pStat ? pStat.total : 0;

      if (dayStr === todayStr) {
        dayInvoiced = todayInvoiced;
        dayPaid = todayPaid;
      }

      revenueHistory.push({
        date: dayStr,
        day: dayName,
        revenue: dayPaid,
        invoiced: dayInvoiced,
        paid: dayPaid,
      });
    }

    // 5. Calculate Trends
    const currentPeriodRev = revenueHistory.reduce((a, b) => a + b.revenue, 0);
    const previousPeriodRevResult = await Invoice.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(ownerId),
          createdAt: { $gte: prevRangeStart, $lt: rangeStart },
          status: { $in: ["Paid", "Partially Paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const prevRev = previousPeriodRevResult[0]?.total || 0;
    const revenueTrend =
      prevRev === 0
        ? 100
        : Math.round(((currentPeriodRev - prevRev) / prevRev) * 100);

    // Service Trend (based on range)
    const currentPeriodServices = await Service.countDocuments({
      ownerId,
      createdAt: { $gte: rangeStart },
    });
    const previousPeriodServices = await Service.countDocuments({
      ownerId,
      createdAt: { $gte: prevRangeStart, $lt: rangeStart },
    });
    const servicesTrend =
      previousPeriodServices === 0
        ? 100
        : Math.round(
            ((currentPeriodServices - previousPeriodServices) /
              previousPeriodServices) *
              100,
          );

    // Customer Trend (based on range)
    const previousPeriodCustomers = await Customer.countDocuments({
      ownerId,
      createdAt: { $gte: prevRangeStart, $lt: rangeStart },
    });
    const customersTrend =
      previousPeriodCustomers === 0
        ? 100
        : Math.round(
            ((newCustomers - previousPeriodCustomers) /
              previousPeriodCustomers) *
              100,
          );

    // 6. Get Arrays
    const recentServices = await Service.find({ ownerId })
      .populate("customerId", "name")
      .populate("advisorId", "name")
      .populate("mechanicId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const lowStockItems = await Inventory.find({
      ownerId,
      $expr: { $lte: ["$stock", "$minLimit"] },
    }).limit(5);

    // 7. Reminder Statistics
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    const latestServices = await Service.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(ownerId),
          status: "Completed",
          nextServiceDate: { $ne: null },
        },
      },
      { $sort: { serviceDate: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$vehicleId",
          nextServiceDate: { $first: "$nextServiceDate" },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "_id",
          as: "vehicleInfo",
        },
      },
      {
        $unwind: {
          path: "$vehicleInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    let dueToday = 0;
    let dueThisWeek = 0;
    let overdueReminders = 0;

    latestServices.forEach((s) => {
      const nextDate = new Date(s.nextServiceDate);
      const isCompleted = s.vehicleInfo?.reminderStatus === "Completed";

      if (nextDate >= startOfToday && nextDate <= endOfToday) {
        dueToday++;
      }
      if (nextDate >= startOfToday && nextDate <= weekEnd) {
        dueThisWeek++;
      }
      if (nextDate < startOfToday && !isCompleted) {
        overdueReminders++;
      }
    });

    const remindersSent = await Vehicle.countDocuments({
      garageId: ownerId,
      reminderStatus: "Reminder Sent",
    });

    // 8. Send the enhanced dashboard data
    res.status(200).json({
      totalRevenue: Number(totalRevenue),
      activeServices: Number(totalActiveServices),
      newCustomers: Number(newCustomers),
      reminderStats: {
        dueToday,
        dueThisWeek,
        overdue: overdueReminders,
        pending: remindersSent,
      },
      staffCount: {
        advisors: Number(advisorCount),
        mechanics: Number(mechanicCount),
        total: Number(advisorCount + mechanicCount),
      },
      recentServices: recentServices || [],
      lowStockItems: lowStockItems || [],
      revenueHistory: revenueHistory,
      serviceBreakdown: serviceBreakdown,
      todayStats: {
        invoiced: todayInvoiced,
        paid: todayPaid,
        pending: todayPending,
        previousPayments: previousPayments,
      },
      trends: {
        revenue: revenueTrend,
        services: servicesTrend,
        customers: customersTrend,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    // next(error);
  }
};
