import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["Email", "WhatsApp", "SMS"],
      default: "Email",
    },
    status: {
      type: String,
      enum: ["Sent", "Failed", "Pending"],
      default: "Sent",
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    message: String,
    error: String,
  },
  { timestamps: true }
);

const ReminderLog = mongoose.model("ReminderLog", reminderLogSchema);
export default ReminderLog;
