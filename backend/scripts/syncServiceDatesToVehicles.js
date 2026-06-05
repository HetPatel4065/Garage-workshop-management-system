import mongoose from "mongoose";
import dotenv from "dotenv";
import Vehicle from "../models/Vehicle.js";
import Service from "../models/Service.js";

dotenv.config();

async function syncServiceDatesToVehicles() {
  try {
    console.log("🔄 Starting service dates sync to vehicles...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all vehicles
    const vehicles = await Vehicle.find({}).lean();
    console.log(`📦 Found ${vehicles.length} vehicles to process`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      try {
        // Find the latest service for this vehicle
        const latestService = await Service.findOne({
          vehicleId: vehicle._id,
          serviceDate: { $exists: true, $ne: null },
        })
          .select("serviceDate nextServiceDate")
          .sort({ serviceDate: -1 })
          .lean();

        if (latestService) {
          // Update vehicle with service dates from latest service
          await Vehicle.updateOne(
            { _id: vehicle._id },
            {
              serviceDate: latestService.serviceDate,
              nextServiceDate: latestService.nextServiceDate,
            },
          );
          syncedCount++;
          console.log(
            `  ✅ ${vehicle.licensePlate} - Synced from service dated ${latestService.serviceDate.toLocaleDateString()}`,
          );
        } else {
          console.log(`  ⏭️  ${vehicle.licensePlate} - No services found`);
        }
      } catch (err) {
        errorCount++;
        console.error(
          `  ❌ Error syncing ${vehicle.licensePlate}:`,
          err.message,
        );
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   Synced: ${syncedCount} vehicles`);
    console.log(`   Errors: ${errorCount} vehicles`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

syncServiceDatesToVehicles();
