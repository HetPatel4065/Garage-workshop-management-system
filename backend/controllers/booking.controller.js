import Booking from "../models/Booking.js";
import VehicleSale from "../models/VehicleSale.js";
import {
  resolvePortalCustomerId,
  requirePortalCustomerId,
} from "../utils/portalCustomerContext.js";
import { logActivity } from "../utils/activityLogger.js";

const VEHICLE_STATUS_VALUES = ["Available", "Booked", "Sold", "Hidden"];

export const createBookingRequest = async (req, res) => {
  try {
    const customerId = resolvePortalCustomerId(req);
    if (!customerId) {
      return requirePortalCustomerId(req, res);
    }

    const { id } = req.params;
    const { requestType = "booking", note = "" } = req.body;

    const vehicle = await VehicleSale.findById(id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (vehicle.status === "Hidden") {
      return res
        .status(404)
        .json({ error: "Vehicle not available for bookings" });
    }

    if (["Booked", "Sold"].includes(vehicle.status)) {
      return res
        .status(400)
        .json({ error: "This vehicle cannot be booked right now" });
    }

    if (requestType === "test-drive" && !vehicle.testDriveAvailable) {
      return res
        .status(400)
        .json({ error: "Test drive is not available for this vehicle" });
    }

    const existingRequest = await Booking.findOne({
      vehicleSaleId: id,
      customerId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        error:
          "You already have an active booking or test drive request for this vehicle",
      });
    }

    const booking = await Booking.create({
      ownerId: vehicle.ownerId,
      vehicleSaleId: id,
      customerId,
      requestType,
      note: String(note || "").trim(),
    });

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("CREATE BOOKING REQUEST ERROR:", error);
    res.status(500).json({ error: "Failed to create booking request" });
  }
};

export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) {
      return res.status(400).json({ error: "Garage owner context required" });
    }

    const bookings = await Booking.find({ ownerId })
      .sort({ requestedAt: -1 })
      .populate({
        path: "vehicleSaleId",
        select: "title brand model year price status",
      })
      .populate({ path: "customerId", select: "name phone email" });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("GET OWNER BOOKINGS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const updateBookingDecision = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) {
      return res.status(400).json({ error: "Garage owner context required" });
    }

    const { id } = req.params;
    const { action, responseNote = "" } = req.body;
    const validActions = ["accept", "reject"];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    if (booking.ownerId.toString() !== ownerId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this booking" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ error: "This booking has already been processed" });
    }

    booking.status = action === "accept" ? "accepted" : "rejected";
    booking.responseNote = String(responseNote || "").trim();
    booking.respondedAt = new Date();
    await booking.save();

    let updatedVehicle = null;
    if (action === "accept" && booking.requestType === "booking") {
      updatedVehicle = await VehicleSale.findByIdAndUpdate(
        booking.vehicleSaleId,
        {
          status: "Booked",
          customerId: booking.customerId,
        },
        { new: true },
      );

      await Booking.updateMany(
        {
          _id: { $ne: booking._id },
          vehicleSaleId: booking.vehicleSaleId,
          status: "pending",
        },
        {
          status: "rejected",
          responseNote:
            "Automatically rejected after another booking was accepted.",
          respondedAt: new Date(),
        },
      );
    }

    res.status(200).json({ success: true, booking, updatedVehicle });
  } catch (error) {
    console.error("UPDATE BOOKING DECISION ERROR:", error);
    res.status(500).json({ error: "Failed to update booking request" });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const customerId = resolvePortalCustomerId(req);
    if (!customerId) {
      return requirePortalCustomerId(req, res);
    }

    const bookings = await Booking.find({ customerId })
      .sort({ requestedAt: -1 })
      .populate({
        path: "vehicleSaleId",
        select: "title brand model year price status",
      })
      .populate({ path: "ownerId", select: "garageName mobileNumber" });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("GET MY BOOKINGS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch booking requests" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const ownerId = req.user?.effectiveOwnerId;
    const customerId = resolvePortalCustomerId(req);

    // Allow owner of the garage or the customer who made the booking to delete
    const allowedByOwner =
      ownerId && booking.ownerId.toString() === ownerId.toString();
    const allowedByCustomer =
      customerId && booking.customerId.toString() === customerId.toString();

    if (!allowedByOwner && !allowedByCustomer) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this booking" });
    }

    await Booking.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE BOOKING ERROR:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
