import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "owner", "advisor", "mechanic", "user"],
      required: true,
    },

    // 🔗 LINKAGE: Points to the Owner's ID. Null for owners.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 🏢 GARAGE DATA (Owned by Owner, referenced by staff)
    garageName: { type: String, trim: true },
    address: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    logo: { type: String }, // 🖼️ Garage Logo Path
    laborRate: { type: Number, default: 60 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (err) {
    throw err;
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);