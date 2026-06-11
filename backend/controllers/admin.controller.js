import Owner from "../models/Owner.js";
import User from "../models/User.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import JobCard from "../models/JobCard.js";
import Service from "../models/Service.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Inventory from "../models/Inventory.js";
import ServiceCatalog from "../models/ServiceCatalog.js";
import GarageSettings from "../models/GarageSettings.js";
import RequestedCustomer from "../models/RequestedCustomer.js";
import mongoose from "mongoose";
import { logActivity } from "../utils/activityLogger.js";

// 📋 GET ALL GARAGES WITH STATS (PAGINATED, SEARCHABLE, FILTERABLE)
export const getGarages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status; // "active" or "suspended"
    const verification = req.query.verification; // "Pending", "Verified", "Rejected"

    const query = { isCoOwner: { $ne: true } };

    if (search) {
      query.$or = [
        { garageName: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.isActive = status === "active";
    }

    if (verification) {
      query.verificationStatus = verification;
    }

    const skip = (page - 1) * limit;

    const totalGarages = await Owner.countDocuments(query);
    const owners = await Owner.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Query stats in parallel for the retrieved garages
    const garagesWithStats = await Promise.all(
      owners.map(async (owner) => {
        const ownerId = owner._id;

        const [advisorCount, mechanicCount, customerCount, serviceCount] =
          await Promise.all([
            Advisor.countDocuments({ ownerId }),
            Mechanic.countDocuments({ ownerId }),
            Customer.countDocuments({ ownerId }),
            Service.countDocuments({ ownerId }),
          ]);

        // Count all owners: 1 primary + co-owners stored in array
        const ownerCount = 1 + (owner.coOwners?.length || 0);

        // Look up garage by name to get the garageId string
        const ownerObj = owner.toObject();
        return {
          ...owner.toObject(),
          totalStaff: advisorCount + mechanicCount + ownerCount, // exclude primary owner from staff count
          totalCustomers: customerCount,
          totalAppointments: serviceCount,
        };
      }),
    );

    res.status(200).json({
      garages: garagesWithStats,
      pagination: {
        total: totalGarages,
        page,
        limit,
        pages: Math.ceil(totalGarages / limit),
      },
    });
  } catch (err) {
    console.error("Failed to get garages:", err);
    res.status(500).json({ error: "Failed to fetch garages directory" });
  }
};

// 🔒 TOGGLE GARAGE ACTIVE STATUS (SUSPEND/ACTIVATE)
export const toggleGarageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ error: "isActive parameter must be a boolean" });
    }

    const owner = await Owner.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    ).select("-password");

    if (!owner)
      return res.status(404).json({ error: "Garage owner not found" });

    // Also suspend users under this garage in the User collection
    await User.updateMany({ ownerId: id }, { $set: { isActive } });

    res.status(200).json({
      message: `Garage has been successfully ${isActive ? "activated" : "suspended"}`,
      garage: owner,
    });
  } catch (err) {
    console.error("Failed to toggle status:", err);
    res.status(500).json({ error: "Failed to update garage status" });
  }
};

// 🛡️ UPDATE GARAGE VERIFICATION STATUS
export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!["Pending", "Verified", "Rejected"].includes(verificationStatus)) {
      return res
        .status(400)
        .json({ error: "Invalid verification status value" });
    }

    const owner = await Owner.findByIdAndUpdate(
      id,
      { $set: { verificationStatus } },
      { new: true },
    ).select("-password");

    if (!owner)
      return res.status(404).json({ error: "Garage owner not found" });

    res.status(200).json({
      message: `Verification status updated to ${verificationStatus}`,
      garage: owner,
    });
  } catch (err) {
    console.error("Failed to update verification status:", err);
    res.status(500).json({ error: "Failed to update verification status" });
  }
};

// ❌ CASCADE DELETE GARAGE AND ALL TENANT DATA (STANDALONE DB COMPATIBLE)
export const deleteGarage = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findById(id);
    if (!owner) {
      return res.status(404).json({ error: "Garage owner not found" });
    }

    // Perform cascade delete across all linked collections in parallel without native transaction sessions
    await Promise.all([
      Owner.deleteMany({
        $or: [{ garageId: owner.garageId }, { _id: owner._id }],
      }),
      GarageSettings.deleteMany({ ownerId: id }),
      User.deleteMany({ ownerId: id }),
      Advisor.deleteMany({ ownerId: id }),
      Mechanic.deleteMany({ ownerId: id }),
      Customer.deleteMany({ ownerId: id }),
      Vehicle.deleteMany({ garageId: id }),
      JobCard.deleteMany({ garageId: id }),
      Service.deleteMany({ ownerId: id }),
      Invoice.deleteMany({ ownerId: id }),
      Notification.deleteMany({ ownerId: id }),
      Inventory.deleteMany({ ownerId: id }),
      ServiceCatalog.deleteMany({ ownerId: id }),
      RequestedCustomer.deleteMany({ ownerId: id }),
    ]);

    res.status(200).json({
      message: "Garage and all associated records permanently deleted",
    });
  } catch (err) {
    console.error("Failed to delete garage:", err);
    res
      .status(500)
      .json({ error: "Failed to delete garage and tenant records" });
  }
};

// 📢 SEND ANNOUNCEMENT/NOTIFICATION TO GARAGE
export const sendAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const owner = await Owner.findById(id);
    if (!owner)
      return res.status(404).json({ error: "Garage owner not found" });

    // Create notification record for this garage
    const notif = new Notification({
      ownerId: id,
      title,
      message,
      type: type || "warning",
      read: false,
    });

    await notif.save();

    res.status(201).json({
      message: "Announcement successfully dispatched to the garage",
      notification: notif,
    });
  } catch (err) {
    console.error("Failed to dispatch announcement:", err);
    res
      .status(500)
      .json({ error: "Failed to dispatch announcement notification" });
  }
};
