import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

async function main() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!MONGO_URI) throw new Error("Missing env MONGO_URI");
  if (!ADMIN_EMAIL) throw new Error("Missing env ADMIN_EMAIL");
  if (!ADMIN_PASSWORD) throw new Error("Missing env ADMIN_PASSWORD");

  const name = ADMIN_NAME || "Admin";
  const email = String(ADMIN_EMAIL).toLowerCase().trim();
  const password = String(ADMIN_PASSWORD);

  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${existing.email} (${existing.role})`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: "admin",
  });

  console.log(`Created admin: ${admin.email} (${admin._id})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
