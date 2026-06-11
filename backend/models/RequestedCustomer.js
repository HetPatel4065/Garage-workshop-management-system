import mongoose from "mongoose";

const requestedCustomerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      uppercase: true,
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    appointmentDate: {
      type: Date,
    },
    appointmentTime: {
      type: String,
    },
    approvedAt: Date,
    requestedService: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance and to prevent duplicates
requestedCustomerSchema.index({ phone: 1, ownerId: 1 });
requestedCustomerSchema.index({ vehicleNumber: 1, ownerId: 1 });

const RequestedCustomer = mongoose.model(
  "RequestedCustomer",
  requestedCustomerSchema,
);

export default RequestedCustomer;
