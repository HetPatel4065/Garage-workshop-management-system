import Vehicle from "../models/Vehicle.js";
import Customer from "../models/Customer.js";
import { calculateNextServiceDate } from "../utils/dateHelper.js";

export const addVehicle = async (req, res) => {
  try {
    const { make, model, year, chassisnumber, licensePlate, customerId, ...rest } = req.body;
    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) return res.status(403).json({ error: "Unauthorized" });

    // 1. Check if customer exists and belongs to the same garage
    const customer = await Customer.findOne({ _id: customerId, ownerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found in this garage" });
    }

    if (customer.status === "Blocked") {
      return res.status(403).json({ error: "Cannot add vehicle: Customer is blocked" });
    }

    const cleanChassis = chassisnumber?.trim() || undefined;

    // 2. Handle Service Dates
    let { serviceDate, nextServiceDate, reminderInterval } = rest;
    if (serviceDate) {
      nextServiceDate = calculateNextServiceDate(serviceDate, reminderInterval || 6);
    }

    // 3. Create the vehicle
    const newVehicle = new Vehicle({
      ...rest,
      make,
      model,
      year: year || new Date().getFullYear(),
      chassisnumber: cleanChassis,
      licensePlate: licensePlate?.trim(),
      customerId,
      customerName: customer.name,
      garageId: ownerId,
      serviceDate,
      nextServiceDate,
      reminderInterval: reminderInterval || 6,
    });

    const savedVehicle = await newVehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "License plate or chassis number already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerVehicles = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const vehicles = await Vehicle.find({ customerId: req.params.customerId, garageId: ownerId })
      .populate("customerId", "name phone email");
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const vehicles = await Vehicle.find({ garageId: ownerId })
      .populate("customerId", "name phone email")
      .populate("jobCards");

    // ── Enrich with last completed service info (name + date) ──
    // Wrap in try-catch so any aggregation failure still returns vehicle list.
    try {
      const { default: Service } = await import("../models/Service.js");
      const mongoose = await import("mongoose");
      const { Types: { ObjectId } } = mongoose.default || mongoose;

      // Cast to ObjectId — aggregation pipelines don't auto-cast strings.
      const ownerObjectId = new ObjectId(String(ownerId));
      const vehicleObjectIds = vehicles.map((v) => v._id);

      const lastServices = await Service.aggregate([
        {
          $match: {
            vehicleId: { $in: vehicleObjectIds },
            ownerId: ownerObjectId,
            status: "Completed",
          },
        },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: "$vehicleId",
            serviceName: { $first: "$serviceName" },
            completedAt: { $first: "$endTime" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
      ]);

      const lastServiceMap = {};
      lastServices.forEach((s) => {
        lastServiceMap[s._id.toString()] = {
          lastServiceName: s.serviceName || null,
          lastServiceDate: s.completedAt || s.updatedAt || null,
        };
      });

      const enriched = vehicles.map((v) => {
        const obj = v.toObject();
        const last = lastServiceMap[v._id.toString()];
        if (last) {
          obj.lastServiceName = last.lastServiceName;
          obj.lastServiceDate = last.lastServiceDate || obj.serviceDate || null;
        } else {
          obj.lastServiceDate = obj.serviceDate || null;
        }
        return obj;
      });

      return res.json(enriched);
    } catch (enrichErr) {
      console.error("Vehicle enrichment failed (non-fatal):", enrichErr.message);
      // Graceful fallback — return plain vehicle data without service history
      return res.json(vehicles.map((v) => {
        const obj = v.toObject();
        obj.lastServiceDate = obj.serviceDate || null;
        return obj;
      }));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const vehicle = await Vehicle.findOne({ _id: req.params.id, garageId: ownerId })
      .populate("customerId", "name phone email")
      .populate("jobCards");
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const updateData = { ...req.body };
    if (updateData.chassisnumber !== undefined) {
      updateData.chassisnumber = updateData.chassisnumber?.trim() || undefined;
    }

    // Convert empty strings to undefined to bypass mongoose validation if required
    if (updateData.chassisnumber === "") delete updateData.chassisnumber;

    // Find current vehicle to check existing customer status if customerId not provided in update
    const existingVehicle = await Vehicle.findOne({ _id: req.params.id, garageId: ownerId }).populate("customerId");
    if (!existingVehicle) return res.status(404).json({ error: "Vehicle not found" });

    // Check if new customer is blocked (if provided) or if existing customer is blocked
    if (updateData.customerId) {
      const customer = await Customer.findOne({ _id: updateData.customerId, ownerId });
      if (customer) {
        if (customer.status === "Blocked") {
          return res.status(403).json({ error: "Cannot update vehicle: Target customer is blocked" });
        }
        updateData.customerName = customer.name;
      }
    } else if (existingVehicle.customerId?.status === "Blocked") {
      return res.status(403).json({ error: "Cannot update vehicle: Current customer is blocked" });
    }

    // Handle Service Dates logic
    if (updateData.serviceDate || updateData.reminderInterval !== undefined) {
      const sDate = updateData.serviceDate || existingVehicle.serviceDate;
      const rInterval = updateData.reminderInterval !== undefined ? updateData.reminderInterval : existingVehicle.reminderInterval;
      
      if (sDate) {
        updateData.nextServiceDate = calculateNextServiceDate(sDate, rInterval);
      }
    }

    // If nextServiceDate is manually edited, validate it's not before serviceDate
    if (updateData.nextServiceDate && (updateData.serviceDate || existingVehicle.serviceDate)) {
      const nDate = new Date(updateData.nextServiceDate);
      const sDate = new Date(updateData.serviceDate || existingVehicle.serviceDate);
      if (nDate < sDate) {
        return res.status(400).json({ error: "Next service date cannot be earlier than service date" });
      }
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, garageId: ownerId },
      updateData,
      { new: true, runValidators: true }
    ).populate("customerId", "name phone email");

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "License plate or chassis number already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, garageId: ownerId });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
