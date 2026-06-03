import RequestedCustomer from "../models/RequestedCustomer.js";
import Owner from "../models/Owner.js";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Customer from "../models/Customer.js";
import Notification from "../models/Notification.js";
import Vehicle from "../models/Vehicle.js";
import JobCard from "../models/JobCard.js";
import Invoice from "../models/Invoice.js";
import Service from "../models/Service.js";
import { sendOTP } from "../utils/email.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import GarageSettings from "../models/GarageSettings.js";
import { generateAndSaveInvoicePDF } from "../utils/generateInvoice.js";
import { createNotification } from "../utils/notificationHelper.js";
import { uploadInvoicePDF, getSignedDownloadUrl } from "../services/cloudinary.service.js";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";

const STAFF_PORTAL_ROLES = ["admin"];

const isStaffPortalUser = (user) =>
  STAFF_PORTAL_ROLES.includes(user?.role?.toLowerCase());

const PORTAL_PREVIEW_CUSTOMER_HEADER = "x-portal-preview-customer-id";

const getAdminPreviewCustomerId = (req) => {
  if (!isStaffPortalUser(req.user)) return null;
  const id = req.header(PORTAL_PREVIEW_CUSTOMER_HEADER);
  if (!id || id === "null" || id === "undefined") return null;
  return id;
};

const resolveGarageForStaff = async (ownerId) => {
  if (!ownerId) return null;
  let garage =
    (await Owner.findById(ownerId)
      .select("garageName address mobileNumber logo location")
      .lean()) ||
    (await User.findById(ownerId)
      .select("garageName address mobileNumber logo")
      .lean());
  return garage || null;
};

export const getPublicGarages = async (req, res) => {
  try {
    // Fetch all owners who have a garage name
    const garages = await Owner.find({ garageName: { $exists: true, $ne: "" } })
      .select("name garageName address mobileNumber logo location note _id")
      .lean();

    res.status(200).json({
      success: true,
      data: garages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendRegistrationOTP = async (req, res) => {
  try {
    const { email, garageId } = req.body;

    if (!email || !garageId) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Garage ID are required" });
    }

    // Check if customer already exists for this garage
    const existingCustomer = await Customer.findOne({
      email,
      ownerId: garageId,
    });
    if (existingCustomer && existingCustomer.status !== "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Customer already exists for this garage",
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Store OTP in DB
    await OTP.findOneAndUpdate(
      { email },
      { otp: hashedOtp, expiresAt, attempts: 0, verified: false },
      { upsert: true, new: true },
    );

    // Send email
    const emailSent = await sendOTP(email, otpCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicleNumber,
      vehicleModel,
      location,
      garageId,
      otp,
      requestService,
      requestedService,
      complaint,
    } = req.body;

    const serviceComplaint = String(
      requestedService || requestService || complaint || "",
    ).trim();

    if (!name || !email || !phone || !garageId || !otp) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Verify OTP
    const otpData = await OTP.findOne({ email });
    if (!otpData) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (otpData.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, otpData.otp);

    if (!isMatch) {
      otpData.attempts += 1;
      await otpData.save();

      if (otpData.attempts >= 3) {
        await OTP.deleteOne({ email });
        return res.status(400).json({
          success: false,
          message: "Max attempts reached. Please request a new OTP.",
        });
      }

      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified
    otpData.verified = true;
    await otpData.save();

    // Create Requested Customer
    const requestedCustomer = await RequestedCustomer.create({
      customerName: name,
      email,
      phone,
      location: location || "N/A",
      vehicleNumber: vehicleNumber || "N/A",
      vehicleModel: vehicleModel || "N/A",
      requestedService: serviceComplaint || undefined,
      ownerId: garageId,
      status: "pending",
      requestedAt: new Date(),
    });

    const displayVehicle = vehicleNumber
      ? String(vehicleNumber).trim().toUpperCase()
      : "No Vehicles";
    const notificationMessage = serviceComplaint
      ? `New registration request from ${name} (${displayVehicle}). Complaint: ${serviceComplaint}`
      : `New registration request from ${name} (${displayVehicle})`;

    // 🔔 Create Notification for Owner
    await createNotification({
      ownerId: garageId,
      title: "New Customer Request",
      message: notificationMessage,
      type: "new_customer",
      link: `/requested-customers`,
    });

    // Delete OTP after success
    await OTP.deleteOne({ email });

    res.status(201).json({
      success: true,
      message: "Registration request sent. Please wait for garage approval.",
      data: requestedCustomer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if customer exists in ANY garage
    let customer = await Customer.findOne({ email });
    let requestedCustomer = null;

    if (!customer) {
      // If no active customer, check if there's a requested customer (pending or rejected)
      requestedCustomer = await RequestedCustomer.findOne({ email })
        .populate("ownerId", "garageName")
        .sort({ requestedAt: -1 });

      if (!requestedCustomer) {
        return res.status(404).json({
          success: false,
          message: "No account or registration request found with this email",
        });
      }

      // If they are pending or rejected, return status immediately without sending OTP
      return res.status(200).json({
        success: true,
        isRequested: true,
        status: requestedCustomer.status,
        rejectionReason: requestedCustomer.rejectionReason,
        customerName: requestedCustomer.customerName,
        garageName: requestedCustomer.ownerId?.garageName,
        requestedAt: requestedCustomer.requestedAt,
      });
    } else if (customer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Your account status is ${customer.status}. Please contact the garage.`,
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    await OTP.findOneAndUpdate(
      { email },
      { otp: hashedOtp, expiresAt, attempts: 0, verified: false },
      { upsert: true, new: true },
    );

    const emailSent = await sendOTP(email, otpCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const otpData = await OTP.findOne({ email });
    if (!otpData) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (otpData.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, otpData.otp);
    if (!isMatch) {
      otpData.attempts += 1;
      await otpData.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified
    const customer = await Customer.findOne({ email }).populate(
      "ownerId",
      "garageName address mobileNumber logo",
    );

    if (!customer) {
      // If no customer record, they must be a requested customer
      const requested = await RequestedCustomer.findOne({ email })
        .populate("ownerId", "garageName address mobileNumber logo")
        .sort({ requestedAt: -1 });

      await OTP.deleteOne({ email });

      return res.status(200).json({
        success: true,
        isRequested: true,
        status: requested.status,
        rejectionReason: requested.rejectionReason,
        customerName: requested.customerName,
        garageName: requested.ownerId?.garageName,
        requestedAt: requested.requestedAt,
      });
    }

    // Generate Token
    const token = jwt.sign(
      { id: customer._id, role: "customer", ownerId: customer.ownerId._id },
      process.env.JWT_SECRET,
      { expiresIn: "15d" },
    );

    await OTP.deleteOne({ email });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: "customer",
        garage: customer.ownerId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Active customers eligible for portal OTP login — admin preview dropdown */
export const getPortalEligibleCustomers = async (req, res) => {
  try {
    if (!isStaffPortalUser(req.user)) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const filter = { status: "Active" };
    if (req.user.effectiveOwnerId) {
      filter.ownerId = req.user.effectiveOwnerId;
    }

    const customers = await Customer.find(filter)
      .select("name email phone customerId ownerId")
      .populate("ownerId", "garageName")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: customers.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        customerId: c.customerId,
        garageName: c.ownerId?.garageName || "Unknown Garage",
        garageId: c.ownerId?._id,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerDashboardData = async (req, res) => {
  try {
    let customerId = req.user._id || req.user.id;

    if (isStaffPortalUser(req.user)) {
      const previewId = getAdminPreviewCustomerId(req);
      if (!previewId) {
        return res.status(200).json({
          success: true,
          data: { vehicles: [], jobCards: [], invoices: [], services: [] },
        });
      }
      const previewCustomer = await Customer.findOne({
        _id: previewId,
        status: "Active",
      }).lean();
      if (!previewCustomer) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }
      customerId = previewCustomer._id;
    }

    const [vehicles, rawJobCards, invoices, rawServices] = await Promise.all([
      Vehicle.find({ customerId }).lean(),
      JobCard.find({ customerId })
        .sort({ createdAt: -1 })
        .populate("mechanicId", "name")
        .populate("advisorId", "name")
        .lean(),
      Invoice.find({ customerId })
        .populate({
          path: "serviceId",
          populate: { path: "vehicleId", select: "licensePlate" },
        })
        .sort({ createdAt: -1 })
        .lean(),
      // Individual service records — each has its own mechanic + advisor
      Service.find({ customerId })
        .sort({ createdAt: -1 })
        .populate("mechanicId", "name")
        .populate("advisorId", "name")
        .populate("jobId", "jobCardId licensePlate status")
        .lean(),
    ]);

    // ── Enrich JobCards with Service detail (parts, labor, selected services) ──
    const jobCardIds = rawJobCards.map((j) => j._id);
    const services1 = jobCardIds.length
      ? await Service.find({ jobId: { $in: jobCardIds } })
          .populate("mechanicId", "name")
          .populate("advisorId", "name")
          .lean()
      : [];

    // Build a map: jobCardId (string) -> service records
    const servicesByJobCard = {};
    services1.forEach((svc) => {
      const key = String(svc.jobId);
      if (!servicesByJobCard[key]) servicesByJobCard[key] = [];
      servicesByJobCard[key].push(svc);
    });

    const jobCards = rawJobCards.map((job) => {
      const related = servicesByJobCard[String(job._id)] || [];

      // Aggregate across all service records linked to this job card
      const parts = related.flatMap((s) =>
        (s.partsUsed || []).map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unitPrice: p.priceAtTimeOfService ?? p.priceAtTime ?? 0,
          total:
            (p.quantity || 1) * (p.priceAtTimeOfService ?? p.priceAtTime ?? 0),
        })),
      );

      const laborCharges = related.flatMap((s) =>
        (s.labourCharges || []).map((l) => ({
          description: l.customName || l.laborType || "Labour",
          amount: l.labourCost ?? 0,
        })),
      );

      const selectedServices = related.flatMap((s) =>
        (s.selectedServices || []).map((sv) => ({
          name: sv.name,
          price: sv.priceAtTimeOfService ?? sv.priceAtTime ?? 0,
        })),
      );

      const notes = related
        .map((s) => s.notes)
        .filter(Boolean)
        .join(" | ");

      const partsTotal = parts.reduce((sum, p) => sum + (p.total || 0), 0);
      const laborTotal = laborCharges.reduce(
        (sum, l) => sum + (l.amount || 0),
        0,
      );
      const servicesTotal = selectedServices.reduce(
        (sum, sv) => sum + (sv.price || 0),
        0,
      );
      const totalAmount = partsTotal + laborTotal + servicesTotal || null;

      const serviceMechanic = related.find((s) => s.mechanicId?.name)
        ?.mechanicId?.name;
      const serviceAdvisor = related.find((s) => s.advisorId?.name)?.advisorId
        ?.name;

      return {
        ...job,
        parts,
        laborCharges,
        services: selectedServices,
        notes,
        totalAmount,
        mechanicName: job.mechanicId?.name || serviceMechanic || null,
        advisorName: job.advisorId?.name || serviceAdvisor || null,
        serviceInstructions: job.serviceInstructions || "",
      };
    });

    // ── Normalize individual service records for the Service History tab ──
    const services = rawServices.map((svc) => ({
      _id: svc._id,
      serviceId: svc.serviceId,
      serviceName: svc.serviceName,
      description: svc.description || "",
      status: svc.status,
      priority: svc.priority,
      createdAt: svc.createdAt,
      updatedAt: svc.updatedAt,
      mechanicName: svc.mechanicId?.name || null,
      advisorName: svc.advisorId?.name || null,
      jobCardId: svc.jobId?.jobCardId || null,
      licensePlate:
        svc.jobId?.licensePlate || svc.vehicle?.licensePlate || null,
      vehicle: svc.vehicle || null,
      cost: svc.cost || 0,
      labourCost: svc.labourCost || 0,
      totalCost: (svc.cost || 0) + (svc.labourCost || 0),
      parts: (svc.partsUsed || []).map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.priceAtTimeOfService ?? p.priceAtTime ?? 0,
        total:
          (p.quantity || 1) * (p.priceAtTimeOfService ?? p.priceAtTime ?? 0),
      })),
      laborCharges: (svc.labourCharges || []).map((l) => ({
        description: l.customName || l.laborType || "Labour",
        amount: l.labourCost ?? 0,
      })),
      selectedServices: (svc.selectedServices || []).map((sv) => ({
        name: sv.name,
        price: sv.priceAtTimeOfService ?? sv.priceAtTime ?? 0,
      })),
      requestedServices: svc.requestedServices || [],
      notes: svc.notes || "",
    }));

    res.status(200).json({
      success: true,
      data: { vehicles, jobCards, invoices, services },
    });
  } catch (error) {
    console.error("Portal Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /portal/me — safe profile endpoint for customer portal
export const getPortalMe = async (req, res) => {
  try {
    if (isStaffPortalUser(req.user)) {
      const previewId = getAdminPreviewCustomerId(req);
      if (previewId) {
        const customer = await Customer.findOne({
          _id: previewId,
          status: "Active",
        })
          .populate("ownerId", "garageName address mobileNumber logo")
          .lean();

        if (customer) {
          return res.status(200).json({
            success: true,
            data: {
              id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              role: "customer",
              garage: customer.ownerId,
              isStaffPreview: true,
              previewAsCustomer: true,
            },
          });
        }
      }

      const garage = await resolveGarageForStaff(req.user.effectiveOwnerId);
      return res.status(200).json({
        success: true,
        data: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.mobileNumber || req.user.phone || null,
          role: req.user.role,
          garage,
          isStaffPreview: true,
        },
      });
    }

    const customerId = req.user._id || req.user.id;
    const customer = await Customer.findById(customerId)
      .populate("ownerId", "garageName address mobileNumber logo")
      .lean();

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: "customer",
        garage: customer.ownerId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLinkedGarages = async (req, res) => {
  try {
    const customerId = req.user._id;
    const currentCustomer = await Customer.findById(customerId);
    if (!currentCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const linkedCustomers = await Customer.find({
      email: currentCustomer.email,
    }).populate("ownerId", "garageName address mobileNumber logo location");

    const garages = linkedCustomers
      .map((c) => ({
        garageId: c.ownerId._id,
        garageName: c.ownerId.garageName,
        address: c.ownerId.address,
        mobileNumber: c.ownerId.mobileNumber,
        logo: c.ownerId.logo,
        location: c.ownerId.location,
        lastVisitedAt: c.updatedAt,
        customerId: c._id,
      }))
      .sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt));

    res.status(200).json({ success: true, data: garages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const selectGarage = async (req, res) => {
  try {
    const { targetGarageId } = req.body;
    const customerId = req.user._id;

    const currentCustomer = await Customer.findById(customerId);
    if (!currentCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const targetCustomer = await Customer.findOne({
      email: currentCustomer.email,
      ownerId: targetGarageId,
    }).populate("ownerId", "garageName address mobileNumber logo location");

    if (!targetCustomer) {
      return res
        .status(403)
        .json({ success: false, message: "No access to this garage" });
    }

    targetCustomer.updatedAt = new Date();
    await targetCustomer.save();

    const token = jwt.sign(
      {
        id: targetCustomer._id,
        role: "customer",
        ownerId: targetCustomer.ownerId._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15d" },
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: targetCustomer._id,
        name: targetCustomer.name,
        email: targetCustomer.email,
        role: "customer",
        garage: targetCustomer.ownerId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allocateGarage = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const customerId = req.user._id;

    const currentCustomer = await Customer.findById(customerId);
    if (!currentCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const linkedCustomers = await Customer.find({
      email: currentCustomer.email,
    }).populate("ownerId", "garageName address mobileNumber logo location");

    if (linkedCustomers.length > 0) {
      const customerIds = linkedCustomers.map((c) => c._id);

      const activeJob = await JobCard.findOne({
        customerId: { $in: customerIds },
        status: { $in: ["pending", "in-progress"] },
      }).populate("garageId", "garageName address mobileNumber logo location");

      if (activeJob) {
        const c = linkedCustomers.find(
          (lc) =>
            lc.ownerId._id.toString() === activeJob.garageId._id.toString(),
        );
        return res.status(200).json({
          success: true,
          data: {
            type: "ACTIVE",
            garage: {
              garageId: activeJob.garageId._id,
              garageName: activeJob.garageId.garageName,
              address: activeJob.garageId.address,
              mobileNumber: activeJob.garageId.mobileNumber,
              logo: activeJob.garageId.logo,
              location: activeJob.garageId.location,
              lastVisitedAt: c ? c.updatedAt : new Date(),
            },
          },
        });
      }

      const garages = linkedCustomers
        .map((c) => ({
          garageId: c.ownerId._id,
          garageName: c.ownerId.garageName,
          address: c.ownerId.address,
          mobileNumber: c.ownerId.mobileNumber,
          logo: c.ownerId.logo,
          location: c.ownerId.location,
          lastVisitedAt: c.updatedAt,
        }))
        .sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt));

      if (garages.length === 1) {
        return res.status(200).json({
          success: true,
          data: {
            type: "LAST_USED_SINGLE",
            garage: garages[0],
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          data: {
            type: "LAST_USED_MULTIPLE",
            garages: garages,
          },
        });
      }
    }

    const allOwners = await Owner.find({
      garageName: { $exists: true, $ne: "" },
    }).lean();

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let nearest = allOwners;
    if (lat && lng) {
      nearest = allOwners
        .map((o) => ({
          garageId: o._id,
          garageName: o.garageName,
          address: o.address,
          mobileNumber: o.mobileNumber,
          logo: o.logo,
          location: o.location,
          distance: calculateDistance(
            lat,
            lng,
            o.location?.lat,
            o.location?.lng,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
    } else {
      nearest = nearest
        .map((o) => ({
          garageId: o._id,
          garageName: o.garageName,
          address: o.address,
          mobileNumber: o.mobileNumber,
          logo: o.logo,
          location: o.location,
        }))
        .slice(0, 3);
    }

    return res.status(200).json({
      success: true,
      data: {
        type: "NEAREST",
        garages: nearest,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 📄 GENERATE INVOICE PDF FOR PORTAL
export const generatePortalInvoicePDF = async (req, res) => {
  const { id } = req.params;
  let customerId = req.user._id || req.user.id;

  if (isStaffPortalUser(req.user)) {
    const previewId = getAdminPreviewCustomerId(req);
    if (!previewId) {
      return res
        .status(400)
        .json({ success: false, message: "Select a customer to preview" });
    }
    customerId = previewId;
  }

  try {
    // 1. Fetch fully-populated invoice, ensuring it belongs to the logged-in customer
    const invoice = await Invoice.findOne({ _id: id, customerId })
      .populate("customerId")
      .populate({
        path: "serviceId",
        populate: [{ path: "vehicleId" }, { path: "partsUsed.partId" }],
      });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found or unauthorized" });
    }

    // 2. Fetch garage settings and owner profile for branding
    const ownerId = invoice.ownerId;
    const [settings, owner] = await Promise.all([
      GarageSettings.findOne({ ownerId }),
      Owner.findById(ownerId).select("logo mobileNumber garageName address"),
    ]);

    const branding = {
      ...(settings ? settings.toObject() : {}),
      logo: settings?.invoiceLogo || owner?.logo || "",
      mobileNumber: settings?.contactNumber || owner?.mobileNumber || "",
      garageName: settings?.garageName || owner?.garageName || "Garage Name",
      businessAddress:
        settings?.businessAddress || owner?.address || "Garage Address",
    };

    // 3. Generate PDF and save to /uploads/invoices/
    const relativePath = await generateAndSaveInvoicePDF(invoice, branding);
    const filePath = path.join(process.cwd(), "uploads", relativePath);

    // 4. Upload to Cloudinary via the centralised service
    try {
      const { secure_url, public_id } = await uploadInvoicePDF(filePath, ownerId);
      invoice.pdfUrl = secure_url;
      invoice.publicId = public_id;
      await invoice.save();
    } catch (err) {
      console.error("[Portal] Cloudinary upload failed for portal invoice PDF:", err.message);
      const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
      invoice.pdfUrl = `${BASE_URL}/uploads/${relativePath}`;
      invoice.publicId = null;
      await invoice.save();
    }

    try {
      await fs.unlink(filePath);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: "Invoice PDF generated successfully",
      pdfUrl: `${invoice.pdfUrl}?t=${Date.now()}`,
    });
  } catch (error) {
    console.error("[Portal PDF Generation Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate invoice PDF" });
  }
};

export const downloadPortalInvoicePDF = async (req, res) => {
  const { id } = req.params;
  let customerId = req.user._id || req.user.id;

  if (isStaffPortalUser(req.user)) {
    const previewId = getAdminPreviewCustomerId(req);
    if (previewId) {
      customerId = previewId;
    }
  }

  try {
    const invoice = await Invoice.findOne({ _id: id, customerId });
    if (!invoice) {
      console.error(`[Portal] downloadPortalInvoicePDF - invoice not found or unauthorized: ${id}, customerId: ${customerId}`);
      return res.status(404).json({ error: "Invoice not found or unauthorized" });
    }

    const filename = `Invoice-${invoice.invoiceNumber || invoice._id}.pdf`;

    // ── PATH 1: publicId exists → fetch from Cloudinary server-side and stream back ──
    // We do NOT redirect because the browser would resend custom headers to Cloudinary,
    // causing a CORS preflight failure. Backend fetches the PDF server-to-server and streams it.
    if (invoice.publicId) {
      try {
        const signedUrl = getSignedDownloadUrl(invoice.publicId);
        console.log("[Portal] downloadPortalInvoicePDF - fetching from Cloudinary signed URL (server-side)", {
          invoiceId: id,
          publicId: invoice.publicId,
        });

        const cloudinaryResponse = await fetch(signedUrl);

        if (!cloudinaryResponse.ok) {
          const errText = await cloudinaryResponse.text().catch(() => "");
          console.error("[Portal] downloadPortalInvoicePDF - Cloudinary signed URL fetch failed", {
            status: cloudinaryResponse.status,
            body: errText,
          });
          // Fall through to on-the-fly regeneration
        } else {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

          // Stream Cloudinary response body → Express response
          for await (const chunk of cloudinaryResponse.body) {
            res.write(chunk);
          }
          return res.end();
        }
      } catch (signErr) {
        console.error("[Portal] downloadPortalInvoicePDF - signed URL fetch error:", signErr.message);
        // Fall through to on-the-fly regeneration
      }
    }

    // ── PATH 2: no publicId (legacy / fallback) → regenerate on the fly ──
    console.log(`[Portal] downloadPortalInvoicePDF - no publicId, regenerating PDF on the fly for invoice: ${id}`);

    const populatedInvoice = await Invoice.findOne({ _id: id, customerId })
      .populate("customerId")
      .populate({
        path: "serviceId",
        populate: [{ path: "vehicleId" }, { path: "partsUsed.partId" }],
      });

    if (!populatedInvoice) {
      return res.status(404).json({ error: "Invoice details not found" });
    }

    const ownerId = populatedInvoice.ownerId;
    const [settings, owner] = await Promise.all([
      GarageSettings.findOne({ ownerId }),
      Owner.findById(ownerId).select("logo mobileNumber garageName address"),
    ]);

    const branding = {
      ...(settings ? settings.toObject() : {}),
      logo: settings?.invoiceLogo || owner?.logo || "",
      mobileNumber: settings?.contactNumber || owner?.mobileNumber || "",
      garageName: settings?.garageName || owner?.garageName || "Garage Name",
      businessAddress: settings?.businessAddress || owner?.address || "Garage Address",
    };

    const relativePath = await generateAndSaveInvoicePDF(populatedInvoice, branding);
    const generatedFilePath = path.join(process.cwd(), "uploads", relativePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const readStream = createReadStream(generatedFilePath);

    res.on("finish", async () => {
      try {
        await fs.unlink(generatedFilePath);
      } catch (e) {
        // non-fatal
      }
    });

    readStream.on("error", (err) => {
      console.error("[Portal] downloadPortalInvoicePDF - stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream invoice PDF" });
      }
    });

    return readStream.pipe(res);
  } catch (error) {
    console.error("[Portal] downloadPortalInvoicePDF - unexpected error:", {
      invoiceId: id,
      customerId,
      error: error?.message || error,
    });
    return res.status(500).json({ error: "Failed to download invoice PDF", details: error.message });
  }
};
