import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error", "new_customer", "service_reminder", "unpaid_invoice", "low_stock"],
    default: "info",
  },
  source: {
    type: String,
    enum: ["System", "Admin", "Garage", "Customer"],
    default: "System",
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
  }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
