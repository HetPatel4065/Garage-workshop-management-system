import dotenv from "dotenv";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";

dotenv.config();

async function main() {
  const { MONGO_URI } = process.env;
  if (!MONGO_URI) throw new Error("Missing env MONGO_URI");

  await mongoose.connect(MONGO_URI);

  try {
    // Ensure the unique composite index exists (idempotent)
    await Wishlist.createIndexes();
    console.log("Ensured wishlist indexes");
  } catch (err) {
    console.error("Failed to ensure wishlist indexes:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
