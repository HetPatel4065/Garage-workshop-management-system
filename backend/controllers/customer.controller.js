import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import Owner from "../models/Owner.js";
import { sendWelcomeEmail } from "../utils/email.js";
import { logActivity } from "../utils/activityLogger.js";

const SIX_MONTHS_IN_MS = 1000 * 60 * 60 * 24 * 30 * 6;

const syncCustomerStatuses = async (ownerId) => {
  const now = Date.now();
  const customers = await Customer.find({ ownerId }).lean();

  if (!customers.length) return customers;

  const serviceActivity = await Service.aggregate([
    { $match: { ownerId } },
    {
      $group: {
        _id: "$customerId",
        lastServiceAt: { $max: "$createdAt" },
      },
    },
  ]);

  const activityMap = new Map(
    serviceActivity.map((item) => [String(item._id), item.lastServiceAt]),
  );

  const updates = [];
  const normalizedCustomers = customers.map((customer) => {
    if (["Blocked", "Pending", "Rejected"].includes(customer.status)) {
      return customer;
    }

    const lastServiceAt = activityMap.get(String(customer._id));
    if (!lastServiceAt) {
      return customer;
    }

    const shouldBeInactive =
      now - new Date(lastServiceAt).getTime() >= SIX_MONTHS_IN_MS;
    const nextStatus = shouldBeInactive ? "Inactive" : "Active";

    if (customer.status !== nextStatus) {
      updates.push({
        updateOne: {
          filter: { _id: customer._id },
          update: { $set: { status: nextStatus } },
        },
      });
    }

    return { ...customer, status: nextStatus };
  });

  if (updates.length) {
    await Customer.bulkWrite(updates);
  }

  return normalizedCustomers;
};

export const createCustomer = async (req, res) => {
  try {
    const data = { ...req.body };
    const ownerId = req.user.effectiveOwnerId;

    if (!ownerId) {
      return res.status(403).json({
        error: "Cannot create customer: User is not linked to a garage",
      });
    }

    // Direct customer creation
    const customer = await Customer.create({
      name: data.name || data.customerName,
      phone: data.phone,
      email: data.email,
      address: data.address || {},
      vehicleNumber: data.vehicleNumber || "N/A",
      vehicleModel: data.vehicleModel || "N/A",
      ownerId,
    });
    await logActivity(
      req,
      "create",
      "Customer",
      `Added customer "${customer.name}"`,
      customer._id,
    );

    res.status(201).json({
      ...customer.toObject(),
      message: "Customer created successfully",
    });
  } catch (err) {
    console.error("Create Customer Error:", err);

    res.status(400).json({
      error: err.message || "Failed to create customer",
    });
  }
};

// 📋 GET ALL CUSTOMERS
export const getAllCustomers = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;

    const customers = await syncCustomerStatuses(ownerId);
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

// 🔍 GET SINGLE CUSTOMER
export const getCustomerProfile = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const customers = await syncCustomerStatuses(ownerId);
    const customer = customers.find(
      (item) => String(item._id) === String(req.params.id),
    );

    if (!customer) {
      return res
        .status(404)
        .json({ error: "Customer not found in your garage" });
    }

    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: "Error fetching customer" });
  }
};

// ✏️ UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      req.body,
      { new: true, runValidators: true },
    );

    if (!customer)
      return res
        .status(404)
        .json({ error: "Customer not found or unauthorized" });
      await logActivity(
        req,
        "update",
        "Customer",
        `Updated customer "${customer.name}"`,
        customer._id,
      );
    res.status(200).json(customer);
  } catch (err) {
    console.error("Update Customer Error:", err);
    res.status(400).json({ error: err.message || "Failed to update customer" });
  }
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.effectiveOwnerId;
  try {
    const result = await Customer.findOneAndDelete({ _id: id, ownerId });
    if (!result)
      return res
        .status(404)
        .json({ error: "Customer not found or unauthorized" });
      await logActivity(
        req,  
        "delete",
        "Customer",
        `Deleted customer "${result.name}"`,
        id,
      );
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete Customer Error:", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
};
export const approveCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { customDate } = req.body;
    const updateData = { status: "Active" };
    if (customDate) updateData.serviceDate = customDate;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      updateData,
      { new: true },
    );

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Send welcome email to the customer
    try {
      const { customDate, customTime } = req.body;
      const garageName =
        req.user.garageName || (await Owner.findById(ownerId))?.garageName;
      const ownerName = req.user.name; // Get name from auth middleware

      // Pass custom date/time if provided, otherwise sendWelcomeEmail handles it
      await sendWelcomeEmail(
        customer.email,
        customer.name,
        garageName,
        ownerName,
        customDate,
        customTime,
      );
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      // We don't block the approval if email fails
    }
      await logActivity(
        req,
        "approve",
        "Customer",
        `Approved customer "${customer.name}"`,
        customer._id,
      );
    res
      .status(200)
      .json({ message: "Customer approved successfully", customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  
};

export const rejectCustomer = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      ownerId,
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // After Customer.findOneAndDelete(...) in deleteCustomer
    await logActivity(
      req,
      "reject",
      "Customer",
      `Rejected customer "${customer.name}"`,
      customer._id,
    );
    res
      .status(200)
      .json({ message: "Customer rejected successfully", customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
