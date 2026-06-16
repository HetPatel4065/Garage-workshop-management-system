import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "./models/Customer.js";
import Vehicle from "./models/Vehicle.js";
import JobCard from "./models/JobCard.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log("Starting DB Object Migration...");

      // Get raw customers from MongoDB using the native driver to access the stripped 'vehicles' array
      const db = mongoose.connection.db;
      const customers = await db.collection('customers').find({}).toArray();
      let restoredCount = 0;

      for (const customer of customers) {
        if (customer.vehicles && Array.isArray(customer.vehicles) && customer.vehicles.length > 0) {
          for (const rawVehicle of customer.vehicles) {
            // Check if this vehicle is already migrated by looking up its license plate and garage owner
            const existing = await Vehicle.findOne({ 
                licensePlate: rawVehicle.licensePlate, 
                garageId: customer.ownerId 
            });

            if (!existing) {
              const newVehicle = new Vehicle({
                garageId: customer.ownerId,
                customerId: customer._id,
                customerName: customer.name,
                make: rawVehicle.make,
                model: rawVehicle.model,
                year: rawVehicle.year || 2020,
                licensePlate: rawVehicle.licensePlate,
                chassisnumber: rawVehicle.chassisnumber?.trim() || undefined,
                engineType: rawVehicle.engineType,
                fuelType: rawVehicle.fuelType,
                transmission: rawVehicle.transmission,
                currentMileage: rawVehicle.currentMileage,
                nextServiceDue: rawVehicle.nextServiceDue,
                status: rawVehicle.status || "With Owner",
                notes: rawVehicle.notes
              });
              
              await newVehicle.save();
              restoredCount++;

              // Also check if there was a requested service we can salvage into a JobCard
              if (rawVehicle.requestedService && rawVehicle.requestedService.trim().length > 0) {
                 const newJc = new JobCard({
                    garageId: customer.ownerId,
                    customerId: customer._id,
                    customerName: customer.name,
                    vehicleId: newVehicle._id,
                    licensePlate: newVehicle.licensePlate,
                    serviceInstructions: rawVehicle.requestedService,
                    status: "Open"
                 });
                 await newJc.save();
              }
            }
          }
        }
      }
      console.log(`Migration Complete: Successfully migrated ${restoredCount} legacy vehicles to the new collection.`);

    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
