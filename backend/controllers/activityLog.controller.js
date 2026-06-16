import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog.js";
import Owner from "../models/Owner.js";

export const getMyActivityLog = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { module, action, performer, startDate, endDate, page = 1 } = req.query;

    const owner = await Owner.findById(ownerId).select("garageId").lean();
    if (!owner) return res.status(404).json({ error: "Garage not found" });

    const query = { garageId: owner.garageId };

    if (module && module !== "All") query.module = module;
    if (action && action !== "All") query.action = action;
    if (performer && performer !== "All") {
      if (mongoose.Types.ObjectId.isValid(performer)) {
        query["performedBy.userId"] = new mongoose.Types.ObjectId(performer);
      } else {
        query["performedBy.userId"] = performer;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt();
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt());

    // Get unique performers for filter dropdown
    const performers = await ActivityLog.distinct("performedBy", { garageId: owner.garageId });

    res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt()),
      performers,
    });
  } catch (err) {
    console.error("GET MY ACTIVITY LOG ERROR:", err);
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
};

export const getActivityLog = async (req, res) => {
  try {
    const { garageId } = req.params;
    const { module, action, performer, startDate, endDate, page = 1 } = req.query;

    const query = { garageId };

    if (module && module !== "All") query.module = module;
    if (action && action !== "All") query.action = action;
    if (performer && performer !== "All") {
      if (mongoose.Types.ObjectId.isValid(performer)) {
        query["performedBy.userId"] = new mongoose.Types.ObjectId(performer);
      } else {
        query["performedBy.userId"] = performer;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt();
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt());

    res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt()),
    });
  } catch (err) {
    console.error("GET ACTIVITY LOG ERROR:", err);
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
};

export const deleteMyActivityLogs = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const owner = await Owner.findById(ownerId).select("garageId").lean();
    if (!owner) return res.status(404).json({ error: "Garage not found" });

    const result = await ActivityLog.deleteMany({ garageId: owner.garageId });
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} activity log(s) successfully`,
    });
  } catch (err) {
    console.error("DELETE ACTIVITY LOGS ERROR:", err);
    res.status(500).json({ error: "Failed to delete activity logs" });
  }
};