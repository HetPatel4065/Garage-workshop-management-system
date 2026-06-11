import Notification from "../models/Notification.js";
import Vehicle from "../models/Vehicle.js";
import Owner from "../models/Owner.js";
import {
  sendEmail,
  buildServiceReminderEmail,
} from "../utils/notifications.js";
import { logActivity } from "../utils/activityLogger.js";

export const getNotifications = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const notifications = await Notification.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.effectiveOwnerId;

    await Notification.findOneAndUpdate({ _id: id, ownerId }, { read: true });

    res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    await Notification.updateMany({ ownerId }, { read: true });
    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.effectiveOwnerId;

    const deleted = await Notification.findOneAndDelete({ _id: id, ownerId });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    await Notification.deleteMany({ ownerId });
    res
      .status(200)
      .json({
        success: true,
        message: "All notifications cleared successfully",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendServiceReminder = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res
        .status(400)
        .json({ success: false, message: "Vehicle ID is required." });
    }

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      garageId: ownerId,
    }).populate("customerId", "name email phone");

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Reminder vehicle not found." });
    }

    const customer = vehicle.customerId;
    const customerEmail = customer?.email || vehicle.customerEmail;
    if (!customerEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Customer email is not available." });
    }

    const owner = await Owner.findById(ownerId).select(
      "garageName mobileNumber",
    );
    const emailHtml = buildServiceReminderEmail({
      customerName: customer?.name || vehicle.customerName || "Customer",
      vehicleNumber: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      dueDate: vehicle.nextServiceDate
        ? new Date(vehicle.nextServiceDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "soon",
      garageName: owner?.garageName || "Your Garage",
      contactNumber: owner?.mobileNumber || "Contact the garage",
    });

    await sendEmail({
      to: customerEmail,
      subject: `Service Reminder: ${vehicle.licensePlate} is due soon`,
      html: emailHtml,
      fromName: owner?.garageName || "Garage Reminder",
    });

    vehicle.reminderStatus = "Reminder Sent";
    vehicle.lastReminderSentDate = new Date();
    await vehicle.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Service reminder email sent successfully.",
      });
  } catch (error) {
    console.error("Service Reminder Email Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to send reminder email.",
      });
  }
};
