import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";

async function update() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.updateMany(
    {},
    {
      $addToSet: {
        permissions: { $each: ["view_customers", "create_service"] },
      },
    },
  );
  console.log("Fixed users permissions");
  process.exit(0);
}

update();
