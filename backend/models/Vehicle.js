import mongoose from "mongoose";
import { calculateNextServiceDate } from "../utils/dateHelper.js";

const vehicleSchema = new mongoose.Schema(
  {
    garageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    vehicleId: {
      type: String,
    },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    color: String,
    licensePlate: {
      type: String,
      required: true,
      uppercase: true,
    },
    chassisnumber: {
      type: String,
      uppercase: true,
      minlength: 17,
      maxlength: 17,
    },
    engineType: String,
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"],
      default: "Petrol",
    },
    transmission: {
      type: String,
      enum: ["Automatic", "Manual"],
    },
    currentMileage: {
      type: Number,
      default: 0,
    },
    serviceDate: {
      type: Date,
    },
    nextServiceDate: {
      type: Date,
    },
    reminderInterval: {
      type: Number,
      default: 6, // Default 6 months
    },
    lastReminderSentDate: {
      type: Date,
    },
    reminderStatus: {
      type: String,
      enum: ["Pending", "Reminder Sent", "Customer Contacted", "Service Booked", "Completed", "Overdue"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["In Garage", "With Owner", "Archived"],
      default: "With Owner",
    },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

vehicleSchema.virtual("jobCards", {
  ref: "JobCard",
  localField: "_id",
  foreignField: "vehicleId",
});

vehicleSchema.virtual("displayName").get(function () {
  return `${this.year} ${this.make} ${this.model}`;
});

vehicleSchema.virtual("daysSinceLastService").get(function () {
  if (!this.updatedAt) return null;
  const diffTime = Math.abs(new Date() - this.updatedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

vehicleSchema.pre("save", async function (next) {
  if (this.isModified("serviceDate") || this.isModified("reminderInterval")) {
    if (this.serviceDate) {
      this.nextServiceDate = calculateNextServiceDate(this.serviceDate, this.reminderInterval || 6);
    }
  }

  // Validate nextServiceDate is not earlier than serviceDate
  if (this.nextServiceDate && this.serviceDate && this.nextServiceDate < this.serviceDate) {
    return next(new Error("Next service date cannot be earlier than service date"));
  }

  if (this.isNew && !this.vehicleId) {
    try {
      const lastVehicle = await this.constructor
        .findOne({ garageId: this.garageId })
        .sort({ _id: -1 });

      let maxNum = 1000;

      if (lastVehicle?.vehicleId && lastVehicle.vehicleId.startsWith("VEH-")) {
        const num = parseInt(lastVehicle.vehicleId.split("-")[1], 10);
        if (!isNaN(num)) {
          maxNum = num + 1;
        }
      }

      this.vehicleId = `VEH-${maxNum}`;
    } catch (err) {
      console.error("Error generating vehicleId:", err);
    }
  }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
