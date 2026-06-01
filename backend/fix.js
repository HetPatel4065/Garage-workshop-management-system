import mongoose from "mongoose";
import dotenv from "dotenv";
import JobCard from "./models/JobCard.js";
import Vehicle from "./models/Vehicle.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log("Dropping unique indexes...");
      await JobCard.collection.dropIndex("jobCardId_1").catch(() => console.log("No jobCardId index"));
      await Vehicle.collection.dropIndex("vehicleId_1").catch(() => console.log("No vehicleId index"));
      console.log("Done");
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
