import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    garageId: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.Mixed },
      name: { type: String },
      role: { type: String },
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "reject", "approve"],
      required: true,
    },
    module: {
      type: String,
      enum: [
        "Customer",
        "Vehicle",
        "JobCard",
        "Service",
        "Inventory",
        "Invoice",
        "Staff",
        "ServiceCatalog",
        "VehicleSale",
        "CustomerRequest",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

// Auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;