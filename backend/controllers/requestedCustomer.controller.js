import RequestedCustomer from "../models/RequestedCustomer.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import Notification from "../models/Notification.js";
import Owner from "../models/Owner.js";
import { sendWelcomeEmail, sendRejectionEmail } from "../utils/email.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notificationHelper.js";
import { emitToCustomer } from "../utils/socket.js";

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

    // 1. Check if Customer already exists by phone OR email
    let existingCustomer = await Customer.findOne({
      ownerId,
      $or: [{ phone: request.phone }, { email: request.email }]
    });

    let customerId;
    if (existingCustomer) {
      customerId = existingCustomer._id;
      console.log("Linking to existing customer:", existingCustomer._id);
    } else {
      try {
        let newCustomer = null;
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const nextCustomerId =
              await Customer.generateNextCustomerId(ownerId);
            newCustomer = await Customer.create({
              name: request.customerName,
              phone: request.phone,
              email: request.email,
              address: { street: request.location },
              ownerId,
              customerId: nextCustomerId,
              status: "Pending",
              isVerified: true,
            });
            break;
          } catch (custErr) {
            lastError = custErr;
            if (custErr?.code !== 11000) {
              throw custErr;
            }
          }
        }

        if (!newCustomer) {
          throw lastError || new Error("Could not assign a unique customer ID");
        }

        customerId = newCustomer._id;
        console.log("Created new customer:", customerId);
      } catch (custErr) {
        console.error("Customer Creation Failed:", custErr);

        if (custErr?.code === 11000) {
          const field = Object.keys(custErr.keyPattern || {})[0] || "field";
          return res.status(400).json({
            error:
              field.includes("phone") || field.includes("email")
                ? "A customer with this phone or email already exists for your garage."
                : "Could not assign a unique customer ID. Please try again.",
          });
        }

        return res.status(400).json({
          error: `Failed to create customer record: ${custErr.message}`,
        });
      }
    }

    // 2. Create Vehicle
    const modelParts = (request.vehicleModel || "").trim().split(/\s+/);
    const make = modelParts[0] || "Unknown";
    const model = modelParts.length > 1 ? modelParts.slice(1).join(" ") : "Generic";

    try {
      await Vehicle.create({
        garageId: ownerId,
        customerId: customerId,
        customerName: request.customerName,
        make: make.trim(),
        model: model.trim(),
        year: new Date().getFullYear(),
        licensePlate: request.vehicleNumber.trim(),
        status: "With Owner"
      });
      console.log("Vehicle created successfully");
    } catch (vehErr) {
      console.error("Vehicle Creation Failed:", vehErr);
      return res.status(400).json({ error: `Failed to create vehicle record: ${vehErr.message}` });
    }
    // 3. Update Requested Customer
    let validDate = new Date();
    if (inspectionDate) {
      const parsed = new Date(inspectionDate);
      if (!isNaN(parsed.getTime())) {
        validDate = parsed;
      }
    }

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
    
    // Assign back to request for the email logic below
    Object.assign(request, updatedRequest.toObject());

    // 4. Send Welcome Email & Notification (Async)
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
    emitToCustomer(request.email, "registration_update", {
      status: "approved",
      appointmentDate: validDate,
      appointmentTime: inspectionTime || "10:00 AM",
      customerName: request.customerName,
      garageName: owner?.garageName || "The Garage"
    });

    res.status(200).json({ message: "Customer approved and moved to active records", request });
  } catch (err) {
    console.error("FULL APPROVAL ERROR:", err);
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
