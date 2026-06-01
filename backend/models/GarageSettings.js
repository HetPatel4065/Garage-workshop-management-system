import mongoose from "mongoose";

const garageSettingsSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      unique: true,
    },
    garageName: {
      type: String,
      trim: true,
    },
    invoiceLogo: {
      type: String, // High-res logo for PDF
    },
    businessAddress: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    // Tax Settings
    isGstInclusive: {
      type: Boolean,
      default: false,
    },
    gstRate: {
      type: Number,
      default: 18,
    },
    currency: {
      type: String,
      default: "INR",
    },
    defaultDiscountPercent: {
      type: Number,
      default: 0,
    },

    // Notification preferences
    notifications: {
      emailReports: { type: Boolean, default: false },
      lowStock: { type: Boolean, default: false },
      smsReminders: { type: Boolean, default: false },
      serviceReminders: { type: Boolean, default: false },
      reminderSchedule: {
        type: [Number],
        default: [-7, -3, 0, 3], // 7 days before, 3 days before, on due date, 3 days after
      },
    },
    // SMTP Custom Configuration
    smtp: {
      host: { type: String },
      port: { type: Number },
      secure: { type: Boolean, default: false },
      user: { type: String },
      pass: { type: String },
    },
    // Security settings
    security: {
      twoFactorAuth: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true },
    },
    // Backup tracking
    lastExportedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const GarageSettings = mongoose.model("GarageSettings", garageSettingsSchema);

export default GarageSettings;
