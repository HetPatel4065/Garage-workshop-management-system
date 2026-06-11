import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["owner"],
      default: "owner",
    },
    // Garage details
    garageId: {
      type: String,
      required: false,
      index: true,
    },
    garageName: {
      type: String,
      trim: true,
    },
    isCoOwner: {
      type: Boolean,
      default: false,
    },
    coOwners: [
      {
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        mobileNumber: { type: String, trim: true },
      },
    ],
    address: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    location: {
      lat: Number,
      lng: Number,
    },
    logo: {
      type: String,
    },
    note: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: ["all"],
    },
    laborRate: {
      type: Number,
      default: 0,
    },
    laborPrices: [
      {
        typeOfWork: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

ownerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (this.password?.startsWith("$2a$") || this.password?.startsWith("$2b$")) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

ownerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

ownerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Owner = mongoose.model("Owner", ownerSchema);
export default Owner;
