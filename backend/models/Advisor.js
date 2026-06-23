import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const advisorSchema = new mongoose.Schema(
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
      enum: ["advisor"],
      default: "advisor",
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    permissions: {
      type: [String],
      default: [
        "view_jobcard",
        "inspect_vehicle",
        "create_service",
        "edit_service",
        "delete_service",
        "verify_service",
        "change_status",
        "change_priority",
        "view_services",
        "view_customers",
        "view_inventory",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Add inside ownerSchema, after verificationStatus field:
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    lastLogin: Date,
  },
  { timestamps: true },
);

advisorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

advisorSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

advisorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Advisor = mongoose.model("Advisor", advisorSchema);
export default Advisor;
