import RequestedCustomer from "../models/RequestedCustomer.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import Notification from "../models/Notification.js";
import Owner from "../models/Owner.js";
import { sendWelcomeEmail, sendRejectionEmail } from "../utils/email.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notificationHelper.js";
import { emitToCustomer, emitToOwner } from "../utils/socket.js";
import { logActivity } from "../utils/activityLogger.js";

// ➕ CREATE REQUEST (Portal/Registration)
export const createRequestedCustomer = async (req, res) => {
  try {
    const data = { ...req.body };

    const serviceComplaint = String(
      data.requestedService || data.requestService || data.complaint || "",
    ).trim();
    if (serviceComplaint) {
      data.requestedService = serviceComplaint;
    }
    delete data.requestService;
    delete data.complaint;

    if (!data.ownerId && req.user) {
      data.ownerId = req.user.effectiveOwnerId;
    }

    if (!data.ownerId) {
      return res.status(400).json({ error: "Garage identification is required" });
    }

    // Prevent duplicates (phone or vehicle number)
    const existingRequest = await RequestedCustomer.findOne({
      ownerId: data.ownerId,
      $or: [{ phone: data.phone }, { vehicleNumber: data.vehicleNumber }],
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ error: "A pending request with this phone or vehicle number already exists." });
    }

    const requestedCustomer = await RequestedCustomer.create(data);

    // 🔔 Create notification for owner
    await createNotification({
      ownerId: data.ownerId,
      title: "New Customer Request",
      message: `${data.customerName} has requested registration for vehicle ${data.vehicleNumber}.`,
      type: "new_customer",
      link: `/requested-customers`
    });

    await logActivity(
      req,
      "create",
      "RequestedCustomer",
      `New customer request from ${data.customerName} for vehicle ${data.vehicleNumber}`,
      requestedCustomer._id
    );

    res.status(201).json(requestedCustomer);
  } catch (err) {
    console.error("Create Requested Customer Error:", err);
    res.status(400).json({ error: err.message || "Failed to submit request" });
  }
};

// 📋 GET ALL REQUESTS (Owner)
export const getAllRequestedCustomers = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { status, search } = req.query;

    let query = { ownerId };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const requests = await RequestedCustomer.find(query).sort({ requestedAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

// 🔍 GET SINGLE REQUEST
export const getRequestedCustomerById = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const request = await RequestedCustomer.findOne({ _id: req.params.id, ownerId });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ error: "Error fetching request" });
  }
};

// ✅ APPROVE REQUEST
export const approveRequestedCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { inspectionDate, inspectionTime } = req.body;

    const request = await RequestedCustomer.findOne({ _id: req.params.id, ownerId });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ error: "Request already approved" });
    }

    // Parse appointment date if provided
    let validDate = new Date();
    if (inspectionDate) {
      const parsed = new Date(inspectionDate);
      if (!isNaN(parsed.getTime())) {
        validDate = parsed;
      }
    }

    // Only update the request status and appointment — do NOT create Customer or Vehicle
    const updatedRequest = await RequestedCustomer.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      {
        status: "approved",
        approvedAt: new Date(),
        appointmentDate: validDate,
        appointmentTime: inspectionTime || "10:00 AM",
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Failed to update request status" });
    }

    // Send Welcome Email (Async)
    try {
      const owner = await Owner.findById(ownerId);
      await sendWelcomeEmail(
        request.email,
        request.customerName,
        owner?.garageName || "Our Garage",
        owner?.name || "The Team",
        inspectionDate,
        inspectionTime
      );
    } catch (emailErr) {
      console.error("Non-blocking Email Error:", emailErr);
    }

    // 🔔 Emit to customer for real-time status update
    try {
      const owner = await Owner.findById(ownerId);
      emitToCustomer(request.email, "registration_update", {
        status: "approved",
        appointmentDate: validDate,
        appointmentTime: inspectionTime || "10:00 AM",
        customerName: request.customerName,
        garageName: owner?.garageName || "The Garage"
      });
    } catch (emitErr) {
      console.error("Non-blocking Emit Error:", emitErr);
    }

    await logActivity(
      req,
      "update",
      "RequestedCustomer",
      `Approved customer request from ${request.customerName} for vehicle ${request.vehicleNumber}`,
      request._id
    );

    res.status(200).json({ message: "Request approved with appointment scheduled", request: updatedRequest });
  } catch (err) {
    console.error("APPROVE REQUEST ERROR:", err);
    res.status(500).json({ error: err.message || "Internal server error during approval" });
  }
};

// 📅 UPDATE APPOINTMENT (For already approved/pending requests)
export const updateAppointment = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { appointmentDate, appointmentTime } = req.body;

    if (!appointmentDate) {
      return res.status(400).json({ error: "Appointment date is required" });
    }

    const request = await RequestedCustomer.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      { 
        appointmentDate: new Date(appointmentDate),
        appointmentTime: appointmentTime || "10:00 AM"
      },
      { new: true }
    );

    // 🔔 Emit to customer
    emitToCustomer(request.email, "registration_update", {
      status: request.status,
      appointmentDate: request.appointmentDate,
      appointmentTime: request.appointmentTime,
      customerName: request.customerName
    });

    res.status(200).json({ message: "Appointment updated successfully", request });
  } catch (err) {
    console.error("Update Appointment Error:", err);
    res.status(500).json({ error: "Failed to update appointment" });
  }
};

// ❌ REJECT REQUEST
export const rejectRequestedCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { rejectionReason } = req.body;

    const request = await RequestedCustomer.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      {
        status: "rejected",
        rejectionReason
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    await logActivity(
      req,
      "update",
      "RequestedCustomer",
      `Rejected customer request from ${request.customerName} for vehicle ${request.vehicleNumber}`,
      request._id
    );

    // Send Rejection Email (Async)
    try {
      const owner = await Owner.findById(ownerId);
      await sendRejectionEmail(
        request.email,
        request.customerName,
        owner?.garageName,
        rejectionReason
      );
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
    }

    // 🔔 Emit to customer
    emitToCustomer(request.email, "registration_update", {
      status: "rejected",
      rejectionReason,
      customerName: request.customerName
    });

    res.status(200).json({ message: "Request rejected", request });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to reject request" });
  }
};

// ❌ DELETE REQUEST
export const deleteRequestedCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const request = await RequestedCustomer.findOneAndDelete({ _id: req.params.id, ownerId });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
      await logActivity(
      req,  
      "delete",
      "RequestedCustomer",
      `Deleted customer request from ${request.customerName} for vehicle ${request.vehicleNumber}`,
      request._id
    );

    res.status(200).json({ message: "Request deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete request" });
  }
};

// 📊 GET TODAY'S REQUESTS (For Dashboard)
export const getTodaysInspections = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const requests = await RequestedCustomer.find({
      ownerId,
      createdAt: { $gte: start, $lte: end },
      status: "pending"
    }).sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's requests" });
  }
};
