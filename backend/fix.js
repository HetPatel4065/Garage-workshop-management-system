import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import JobCard from "./models/JobCard.js";
import Vehicle from "./models/Vehicle.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log("Dropping unique indexes...");
      await JobCard.collection.dropIndex("jobCardId_1").catch(() => console.log("No jobCardId index"));
      await Vehicle.collection.dropIndex("vehicleId_1").catch(() => console.log("No vehicleId index"));
      
      const db = mongoose.connection.db;
      console.log("Checking owners collection indexes...");
      const ownerIndexes = await db.collection("owners").indexes();
      console.log("Current owners indexes:", ownerIndexes);
      
      const hasUniqueGarageId = ownerIndexes.find(idx => idx.name === "garageId_1");
      if (hasUniqueGarageId) {
        await db.collection("owners").dropIndex("garageId_1");
        console.log("Dropped unique garageId_1 index on owners collection.");
      } else {
        console.log("No unique garageId_1 index found on owners collection.");
      }
      
      console.log("Done");
    } catch (e) {
      console.error("Error running fix:", e);
    }
    process.exit(0);
  });
