import mongoose from "mongoose";
import { nextCustomerIdFromExisting } from "../utils/customerId.js";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    // References to the owner/garage this customer belongs to
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    address: {
      street: String,
      city: String,
      zip: String,
    }, 

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Pending", "Rejected"],
      default: "Active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    tags: [String],
    notes: String,
    customerId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Calculate total number of vehicles for the UI
customerSchema.virtual("vehicleCount").get(function () {
  return this.vehicles ? this.vehicles.length : 0;
});

customerSchema.statics.generateNextCustomerId = async function (ownerId) {
  if (!ownerId) {
    throw new Error("ownerId is required to generate customerId");
  }

  const customers = await this.find({
    ownerId,
    customerId: { $regex: /^CUST-\d+$/i },
  })
    .select("customerId")
    .lean();

  return nextCustomerIdFromExisting(customers.map((c) => c.customerId));
};

customerSchema.pre("save", async function () {
  if (!this.isNew || this.customerId) return;

  if (!this.ownerId) {
    throw new Error("ownerId is required before saving a customer");
  }

  this.customerId = await this.constructor.generateNextCustomerId(this.ownerId);
});

customerSchema.index({ phone: 1, ownerId: 1 }, { unique: true });
customerSchema.index({ email: 1, ownerId: 1 }, { unique: true });
customerSchema.index({ customerId: 1, ownerId: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;