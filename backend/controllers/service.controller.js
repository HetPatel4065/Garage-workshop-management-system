import Service from "../models/Service.js";
import Inventory from "../models/Inventory.js";
import { notifyLowStock } from "../utils/inventoryUtils.js";
import { calculateNextServiceDate } from "../utils/dateHelper.js";

// 📋 GET SERVICES
export const getAllServices = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;
    const { jobId, billingStatus } = req.query;

    let query = { ownerId };

    if (role === "mechanic") {
      query.mechanicId = userId;
    } else if (role === "advisor") {
      query.advisorId = userId;
    }

    if (jobId) query.jobId = jobId;
    if (billingStatus) query.billingStatus = billingStatus;

    const services = await Service.find(query)
      .populate("customerId", "name")
      .populate("vehicleId", "make model licensePlate serviceDate nextServiceDate")
      .populate("advisorId", "name")
      .populate("mechanicId", "name")
      .populate("partsUsed.partId", "name price")
      .sort({ createdAt: -1 });

    // Calculate dynamic totals for frontend consumption (Unbilled dashboard)
    const enrichedServices = services.map((s) => {
      const obj = s.toObject();

      // Calculate partsTotal from partsUsed array
      obj.partsTotal = (s.partsUsed || []).reduce((sum, p) => {
        const price = p.priceAtTime || p.partId?.price || 0;
        return sum + price * (p.quantity || 1);
      }, 0);

      // Calculate catalogTotal
      obj.catalogTotal = (s.selectedServices || []).reduce((sum, sc) => {
        return sum + (sc.priceAtTime || sc.priceAtTimeOfService || 0);
      }, 0);

      // Final total cost (Labour + Parts + Catalog)
      obj.totalCost =
        (obj.labourCost || obj.labourAtTime || 0) +
        obj.partsTotal +
        obj.catalogTotal;

      return obj;
    });

    res.status(200).json(enrichedServices);
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

// 🔍 GET SERVICE BY ID
export const getServiceById = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;

    const service = await Service.findOne({ _id: req.params.id, ownerId })
      .populate("customerId", "name")
      .populate("advisorId", "name")
      .populate("mechanicId", "name")
      .populate("partsUsed.partId", "name price");

    if (!service) return res.status(404).json({ error: "Service not found" });

    if (
      role === "mechanic" &&
      service.mechanicId?.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "You can only view services assigned to you." });
    }

    if (
      role === "advisor" &&
      service.advisorId?.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "You can only view services assigned to you." });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➕ CREATE SERVICE
export const createService = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;

    const serviceData = { ...req.body, ownerId };

    // Inherit fields from parent Job Card
    if (serviceData.jobId) {
      const { default: JobCard } = await import("../models/JobCard.js");
      const parentJc = await JobCard.findById(serviceData.jobId);
      if (parentJc) {
        if (parentJc.customerId && !serviceData.customerId)
          serviceData.customerId = parentJc.customerId;
        if (parentJc.vehicleId && !serviceData.vehicleId)
          serviceData.vehicleId = parentJc.vehicleId;
        if (parentJc.advisorId && !serviceData.advisorId)
          serviceData.advisorId = parentJc.advisorId;
        if (parentJc.mechanicId && !serviceData.mechanicId)
          serviceData.mechanicId = parentJc.mechanicId;
      }
    }

    if (role === "advisor" && !serviceData.advisorId) {
      serviceData.advisorId = userId;
    }

    if (role === "mechanic" && !serviceData.mechanicId) {
      serviceData.mechanicId = userId;
    }

    // --- STOCK MANAGEMENT (Deduction) ---
    if (serviceData.partsUsed && serviceData.partsUsed.length > 0) {
      for (const part of serviceData.partsUsed) {
        if (part.partId) {
          const qty = Number(part.quantity) || 1;
          const inventoryItem = await Inventory.findById(part.partId);

          if (!inventoryItem)
            throw new Error(`Part not found: ${part.name || "Unknown"}`);
          if (inventoryItem.stock < qty) {
            throw new Error(
              `Insufficient stock for "${inventoryItem.name}". Available: ${inventoryItem.stock}, Requested: ${qty}`,
            );
          }

          // Use findOneAndUpdate with condition for atomic safety
          const updated = await Inventory.findOneAndUpdate(
            { _id: part.partId, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true, runValidators: true },
          );

          if (!updated)
            throw new Error(
              `Stock conflict for "${inventoryItem.name}". Please try again.`,
            );

          // 📱 Notify if low stock
          notifyLowStock(ownerId, updated);
        }
      }
    }

    const newService = new Service(serviceData);
    await newService.save();

    // Sync vehicle dates if provided
    if (serviceData.vehicleId && (req.body.serviceDate || req.body.nextServiceDate)) {
      const { default: Vehicle } = await import("../models/Vehicle.js");
      await Vehicle.findByIdAndUpdate(serviceData.vehicleId, {
        serviceDate: req.body.serviceDate,
        nextServiceDate: req.body.nextServiceDate,
      });
    }

    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✏️ UPDATE SERVICE (WF & Permissions)
export const updateService = async (req, res) => {
  try {
    const { role, _id: userId, effectiveOwnerId: ownerId } = req.user;
    const serviceId = req.params.id;
    const updateData = req.body;

    const service = await Service.findOne({ _id: serviceId, ownerId });
    if (!service) return res.status(404).json({ error: "Service not found" });

    // --- PERMISSION CHECKS ---
    if (role === "mechanic") {
      if (service.mechanicId?.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({
            error: "Unauthorized: You can only edit services assigned to you.",
          });
      }
    } else if (role === "advisor") {
      if (service.advisorId?.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({
            error: "Unauthorized: You can only edit services assigned to you.",
          });
      }
    }

    // --- STOCK MANAGEMENT (Adjustment) ---
    if (updateData.partsUsed) {
      const oldParts = service.partsUsed || [];
      const newParts = updateData.partsUsed;

      // Map to track net change per part
      const stockChanges = new Map();

      // Step 1: Record old quantities (to be restored)
      for (const p of oldParts) {
        if (p.partId) {
          const id = p.partId.toString();
          stockChanges.set(id, (stockChanges.get(id) || 0) + (p.quantity || 1));
        }
      }

      // Step 2: Record new quantities (to be deducted)
      for (const p of newParts) {
        if (p.partId) {
          const id = p.partId.toString();
          stockChanges.set(id, (stockChanges.get(id) || 0) - (p.quantity || 1));
        }
      }

      // Step 3: Validate and Apply changes
      for (const [partId, delta] of stockChanges.entries()) {
        if (delta === 0) continue;

        if (delta < 0) {
          // Net deduction
          const qtyToDeduct = Math.abs(delta);
          const inventoryItem = await Inventory.findById(partId);

          if (!inventoryItem || inventoryItem.stock < qtyToDeduct) {
            throw new Error(
              `Insufficient stock for "${inventoryItem?.name || "Part"}". Available: ${inventoryItem?.stock || 0}, Additional needed: ${qtyToDeduct}`,
            );
          }

          await Inventory.findOneAndUpdate(
            { _id: partId, stock: { $gte: qtyToDeduct } },
            { $inc: { stock: delta } }, // delta is negative
            { runValidators: true },
          );
        } else {
          // Net addition
          await Inventory.findByIdAndUpdate(partId, { $inc: { stock: delta } });
        }

        // 📱 Notify if low stock
        const currentItem = await Inventory.findById(partId);
        notifyLowStock(ownerId, currentItem);
      }
    }

    Object.assign(service, updateData);

    if (updateData.status === "Completed") {
      service.endTime = new Date();
    }

    await service.save();

    // Sync vehicle dates
    if (service.vehicleId) {
      const { default: Vehicle } = await import("../models/Vehicle.js");
      const vehicle = await Vehicle.findById(service.vehicleId);

      if (vehicle) {
        let updateVehicleData = {};

        // If status just changed to Completed, or if dates are explicitly provided
        if (updateData.status === "Completed" || updateData.serviceDate || updateData.nextServiceDate) {
          const completedDate = updateData.serviceDate || new Date();
          const newNextServiceDate =
            updateData.nextServiceDate ||
            calculateNextServiceDate(completedDate, vehicle.reminderInterval || 6);

          updateVehicleData.serviceDate = completedDate;
          updateVehicleData.nextServiceDate = newNextServiceDate;

          const nextNorm = new Date(newNextServiceDate);
          nextNorm.setHours(0, 0, 0, 0);
          const todayNorm = new Date();
          todayNorm.setHours(0, 0, 0, 0);

          if (newNextServiceDate && nextNorm > todayNorm) {
            // New cycle is upcoming → reset reminder workflow to Pending
            updateVehicleData.reminderStatus = "Pending";
          } else {
            // No future cycle (or edge-case past date) → mark as Completed
            updateVehicleData.reminderStatus = "Completed";
          }
        }

        if (Object.keys(updateVehicleData).length > 0) {
          await Vehicle.findByIdAndUpdate(service.vehicleId, updateVehicleData);
        }
      }
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteService = async (req, res) => {
  const { id } = req.params;
  const { role, effectiveOwnerId: ownerId, _id: userId } = req.user;

  try {
    const service = await Service.findOne({ _id: id, ownerId });
    if (!service) return res.status(404).json({ error: "Service not found" });

    if (role === "mechanic") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Mechanics cannot delete services." });
    }

    // --- STOCK MANAGEMENT (Restoration) ---
    // Restore stock ONLY if service is NOT Completed (Pending, In-progress, Cancelled)
    if (
      service.status !== "Completed" &&
      service.partsUsed &&
      service.partsUsed.length > 0
    ) {
      for (const part of service.partsUsed) {
        if (part.partId) {
          await Inventory.findByIdAndUpdate(part.partId, {
            $inc: { stock: part.quantity || 1 },
          });
        }
      }
    }

    await Service.findByIdAndDelete(id);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete service" });
  }
};
