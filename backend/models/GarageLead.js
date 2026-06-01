import mongoose from "mongoose";

const garageLeadSchema = new mongoose.Schema(
  {
    garageName: {
      type: String,
      required: [true, "Garage name is required"],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    servicesOffered: {
      type: [String],
      required: [true, "At least one service must be selected"],
      default: [],
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    signupToken: {
      type: String,
    },
    signupTokenExpires: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "approved", "rejected"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const GarageLead = mongoose.model("GarageLead", garageLeadSchema);
export default GarageLead;
