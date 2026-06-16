import mongoose from "mongoose";
import "./Counter.js"; // Ensure Counter model is registered

const jobCardSchema = new mongoose.Schema(
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
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    licensePlate: {
      type: String,
    },
    // ✅ no unique: true here — compound index below handles it
    jobCardId: {
      type: String,
    },
    advisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisor",
    },
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechanic",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled", "closed"],
      default: "pending",
    },
    serviceInstructions: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ✅ unique per garage, not globally
jobCardSchema.index({ jobCardId: 1, garageId: 1 }, { unique: true });

jobCardSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.jobCardId) {
      const Counter = mongoose.model("Counter");

      const counter = await Counter.findOneAndUpdate(
        { _id: `jobCard_${this.garageId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.jobCardId = `JC-${counter.seq + 999}`;
    }

  } catch (err) {
    console.error("Error generating jobCardId:", err);
    next(err);
  }
});

const JobCard = mongoose.model("JobCard", jobCardSchema);
export default JobCard;
