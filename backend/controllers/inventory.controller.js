import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";
import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";
import {
  notifyLowStock,
  createLowStockNotification,
} from "../utils/inventoryUtils.js";
import { logActivity } from "../utils/activityLogger.js";

// 📋 GET INVENTORY (with search + low stock filter)
export const getInventory = async (req, res) => {
  try {
    const { status, search } = req.query;
    const ownerId = req.user.effectiveOwnerId;
    let query = { ownerId };

    if (search) {
      query.$and = [
        { ownerId },
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
            { carModel: { $regex: search, $options: "i" } },
            { carYear: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    if (status === "low") {
      query.$expr = {
        $and: [
          { $eq: ["$ownerId", { $toObjectId: ownerId }] },
          { $lte: ["$stock", "$minLimit"] },
        ],
      };
    }

    const items = await Inventory.find(query).sort({ stock: 1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: "Inventory fetch failed" });
  }
};

// 🔍 GET SINGLE PART
export const getPartById = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const part = await Inventory.findOne({ _id: req.params.id, ownerId });
    if (!part) {
      return res.status(404).json({ error: "Part not found in your garage" });
    }
    res.status(200).json(part);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch part" });
  }
};

// ➕ ADD PART
export const addPart = async (req, res) => {
  try {
    const data = { ...req.body, ownerId: req.user.effectiveOwnerId };
    const part = await Inventory.create(data);
    await logActivity(
      req,
      "create",
      "Inventory",
      `Added part "${part.name}" (SKU: ${part.sku || "N/A"})`,
      part._id,
    );
    res.status(201).json(part);

    // 📱 Fire low-stock notification
    const ownerId = req.user.effectiveOwnerId;
    notifyLowStock(ownerId, part);
    createLowStockNotification(ownerId, part);
  } catch (error) {
    console.error("ADD PART ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Duplicate Part",
        details: [
          "A part with this SKU / Part Number already exists in your garage.",
        ],
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    res
      .status(500)
      .json({ error: "Failed to add part", message: error.message });
  }
};

// ✏️ UPDATE STOCK
export const updateStock = async (req, res) => {
  const { id } = req.params;
  const { adjustmentType, quantity, reason } = req.body;

  try {
    const ownerId = req.user.effectiveOwnerId;
    const item = await Inventory.findOne({ _id: id, ownerId });
    if (!item)
      return res.status(404).json({ error: "Item not found or unauthorized" });

    const changeAmount = Number(quantity);
    const finalChange = adjustmentType === "add" ? changeAmount : -changeAmount;

    if (adjustmentType === "remove" && item.stock < changeAmount) {
      return res.status(400).json({ error: "Insufficient stock for removal" });
    }

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id, ownerId },
      {
        $inc: { stock: finalChange },
        $push: {
          history: {
            user: req.user._id,
            change: finalChange,
            reason: reason || "Manual Adjustment",
            date: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    await logActivity(
      req,
      "update",
      "Inventory",
      `Updated part "${updatedItem.name}"`,
      updatedItem._id,
    );
    res.status(200).json(updatedItem);

    // Check if the update
    notifyLowStock(ownerId, updatedItem);
    createLowStockNotification(ownerId, updatedItem);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ✏️ EDIT PART DETAILS
export const updatePart = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const updatedPart = await Inventory.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedPart) {
      return res.status(404).json({ error: "Part not found or unauthorized" });
    }

    res.status(200).json(updatedPart);

    // Check if the update (e.g., minLimit change) triggered a low stock state
    notifyLowStock(ownerId, updatedPart);
    createLowStockNotification(ownerId, updatedPart);
  } catch (error) {
    console.error("Update Part Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// 📦 CHECK AVAILABILITY
export const checkAvailability = async (req, res) => {
  const { partsNeeded } = req.body;
  const ownerId = req.user.effectiveOwnerId;

  try {
    const availability = await Promise.all(
      partsNeeded.map(async (p) => {
        const item = await Inventory.findOne({ _id: p.partId, ownerId });
        return {
          name: item?.name || "Unknown",
          available: item ? item.stock >= p.qty : false,
          currentStock: item?.stock || 0,
          requested: p.qty,
        };
      }),
    );
    const allClear = availability.every((p) => p.available);
    res.status(200).json({ allClear, details: availability });
  } catch (error) {
    res.status(500).json({ error: "Availability check failed" });
  }
};

// ❌ DELETE PART
export const deletePart = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.effectiveOwnerId;
  try {
    const part = await Inventory.findOneAndDelete({ _id: id, ownerId });
    if (!part)
      return res.status(404).json({ error: "Part not found or unauthorized" });
    await logActivity(
      req,
      "delete",
      "Inventory",
      `Deleted part "${part.name}"`,
      id,
    );
    res.status(200).json({ message: "Part deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ ADD INVENTORY (Alternative)
export const addInventory = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const data = { ...req.body, ownerId };
    const newItem = await Inventory.create(data);
    await logActivity(
      req,
      "create",
      "Inventory",
      `Added inventory item "${newItem.name}"`,
      newItem._id,
    );
    res.status(201).json(newItem);

    // 📱 Fire low-stock notification
    notifyLowStock(ownerId, newItem);
    createLowStockNotification(ownerId, newItem);
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Duplicate field",
        details: err.keyValue,
      });
    }
    res.status(500).json({ error: "Server error", message: err.message });
  }
};
