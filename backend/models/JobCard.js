import mongoose from "mongoose";

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
      enum: [
        "pending",
        "in-progress",
        "completed",
        "cancelled",
        "closed"
      ],
      default: "pending",
    },
    serviceInstructions: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

jobCardSchema.pre("save", async function (next) {
  if (this.isNew && !this.jobCardId) {
    try {
      const lastJobCard = await this.constructor
        .findOne({ garageId: this.garageId })
        .sort({ _id: -1 });

      let maxNum = 1;
      if (lastJobCard && lastJobCard.jobCardId && lastJobCard.jobCardId.startsWith("JC-")) {
        const num = parseInt(lastJobCard.jobCardId.split("-")[1], 10);
        if (!isNaN(num)) {
          maxNum = num + 1;
        }
      }
      this.jobCardId = `JC-${maxNum}`;
    } catch (err) {
      console.error("Error generating jobCardId:", err);
    }
  }
});

const JobCard = mongoose.model("JobCard", jobCardSchema);
export default JobCard;
