import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

// Models
import Owner from "../models/Owner.js";
import GarageSettings from "../models/GarageSettings.js";
import VehicleSale from "../models/VehicleSale.js";
import Invoice from "../models/Invoice.js";

// Utilities & Services
import { generateAndSaveInvoicePDF } from "../utils/generateInvoice.js";
import { uploadInvoicePDF } from "../services/cloudinary.service.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  } else {
    console.error("Missing Cloudinary configuration!");
    process.exit(1);
  }
}

async function migrate() {
  try {
    console.log("Connecting to Database:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // Helper to resolve local path
    const resolveLocalPath = (dbPath) => {
      if (!dbPath) return null;
      // Strip leading slash if any
      const cleanPath = dbPath.startsWith("/") ? dbPath.substring(1) : dbPath;
      // Check if it's already absolute
      const absolutePath = path.isAbsolute(cleanPath)
        ? cleanPath
        : path.join(backendDir, cleanPath);
      return fs.existsSync(absolutePath) ? absolutePath : null;
    };

    const isLocalPath = (str) => {
      if (!str) return false;
      return !str.startsWith("http://") && !str.startsWith("https://");
    };

    // 1. MIGRATE OWNER LOGOS
    console.log("\n--- Migrating Owner Logos ---");
    const owners = await Owner.find({ logo: { $exists: true, $ne: null } });
    console.log(`Found ${owners.length} owners to inspect.`);
    for (const owner of owners) {
      if (isLocalPath(owner.logo)) {
        console.log(`Owner: ${owner.name} (${owner._id}) has local logo: ${owner.logo}`);
        const localPath = resolveLocalPath(owner.logo);
        if (localPath) {
          try {
            console.log(`Uploading ${localPath} to Cloudinary...`);
            const uploadRes = await cloudinary.uploader.upload(localPath, {
              folder: `garage_logos/${owner._id}`,
            });
            if (uploadRes && uploadRes.secure_url) {
              owner.logo = uploadRes.secure_url;
              await owner.save();
              console.log(`Successfully migrated logo for ${owner.name} to ${uploadRes.secure_url}`);
            }
          } catch (uploadErr) {
            console.error(`Failed to upload logo for Owner ${owner.name}:`, uploadErr.message);
          }
        } else {
          console.warn(`Local file not found for owner logo: ${owner.logo}`);
        }
      }
    }

    // 2. MIGRATE GARAGE SETTINGS LOGOS
    console.log("\n--- Migrating Garage Settings Logos ---");
    const settingsList = await GarageSettings.find({ invoiceLogo: { $exists: true, $ne: null } });
    console.log(`Found ${settingsList.length} settings to inspect.`);
    for (const settings of settingsList) {
      if (isLocalPath(settings.invoiceLogo)) {
        console.log(`Settings for owner: ${settings.ownerId} has local invoiceLogo: ${settings.invoiceLogo}`);
        const localPath = resolveLocalPath(settings.invoiceLogo);
        if (localPath) {
          try {
            console.log(`Uploading ${localPath} to Cloudinary...`);
            const uploadRes = await cloudinary.uploader.upload(localPath, {
              folder: `garage_logos/${settings.ownerId}`,
            });
            if (uploadRes && uploadRes.secure_url) {
              settings.invoiceLogo = uploadRes.secure_url;
              await settings.save();
              console.log(`Successfully migrated invoiceLogo to ${uploadRes.secure_url}`);
            }
          } catch (uploadErr) {
            console.error(`Failed to upload invoice logo for settings of owner ${settings.ownerId}:`, uploadErr.message);
          }
        } else {
          console.warn(`Local file not found for invoice logo: ${settings.invoiceLogo}`);
        }
      }
    }

    // 3. MIGRATE VEHICLE SALE PHOTOS
    console.log("\n--- Migrating Vehicle Sale Photos ---");
    const vehicleSales = await VehicleSale.find({ photos: { $exists: true, $ne: [] } });
    console.log(`Found ${vehicleSales.length} vehicle sales to inspect.`);
    for (const sale of vehicleSales) {
      let updated = false;
      const updatedPhotos = [...sale.photos];
      for (let i = 0; i < updatedPhotos.length; i++) {
        const photo = updatedPhotos[i];
        if (isLocalPath(photo)) {
          console.log(`Listing: ${sale.title} (${sale._id}) has local photo: ${photo}`);
          const localPath = resolveLocalPath(photo);
          if (localPath) {
            try {
              console.log(`Uploading ${localPath} to Cloudinary...`);
              const uploadRes = await cloudinary.uploader.upload(localPath, {
                folder: `vehicle_sales/${sale.ownerId}`,
              });
              if (uploadRes && uploadRes.secure_url) {
                updatedPhotos[i] = uploadRes.secure_url;
                updated = true;
                console.log(`Uploaded to Cloudinary: ${uploadRes.secure_url}`);
              }
            } catch (uploadErr) {
              console.error(`Failed to upload photo for sale ${sale.title}:`, uploadErr.message);
            }
          } else {
            console.warn(`Local file not found for photo: ${photo}`);
          }
        }
      }
      if (updated) {
        sale.photos = updatedPhotos;
        await sale.save();
        console.log(`Updated photos in database for vehicle sale listing: ${sale.title}`);
      }
    }

    // 4. MIGRATE / HEAL INVOICES
    console.log("\n--- Migrating/Regenerating Invoice PDFs to Cloudinary ---");
    const invoices = await Invoice.find({});
    console.log(`Found ${invoices.length} invoices to inspect.`);
    for (const invoice of invoices) {
      const needsCloudinary = !invoice.publicId || isLocalPath(invoice.pdfUrl);
      if (needsCloudinary) {
        console.log(`Invoice ${invoice.invoiceNumber} (${invoice._id}) needs Cloudinary PDF.`);
        
        // Let's populate the invoice properly
        const populatedInvoice = await Invoice.findById(invoice._id)
          .populate("customerId")
          .populate({
            path: "serviceId",
            populate: [{ path: "vehicleId" }, { path: "partsUsed.partId" }],
          });
        
        if (!populatedInvoice) {
          console.error(`Could not populate invoice ${invoice._id}`);
          continue;
        }

        const ownerId = invoice.ownerId;
        if (!ownerId) {
          console.error(`Invoice ${invoice.invoiceNumber} is missing ownerId context! Skipping.`);
          continue;
        }

        const [settings, owner] = await Promise.all([
          GarageSettings.findOne({ ownerId }),
          Owner.findById(ownerId).select("logo mobileNumber garageName address"),
        ]);

        const branding = {
          ...(settings ? settings.toObject() : {}),
          logo: settings?.invoiceLogo || owner?.logo || "",
          mobileNumber: settings?.contactNumber || owner?.mobileNumber || "",
          garageName: settings?.garageName || owner?.garageName || "Garage Name",
          businessAddress: settings?.businessAddress || owner?.address || "Garage Address",
        };

        try {
          console.log(`Regenerating PDF for invoice ${invoice.invoiceNumber}...`);
          const relativePath = await generateAndSaveInvoicePDF(populatedInvoice, branding);
          const filePath = path.join(backendDir, "uploads", relativePath);

          console.log(`Uploading regenerated PDF to Cloudinary: ${filePath}`);
          const { secure_url, public_id } = await uploadInvoicePDF(filePath, ownerId);

          invoice.pdfUrl = secure_url;
          invoice.publicId = public_id;
          await invoice.save();
          console.log(`Successfully migrated invoice ${invoice.invoiceNumber} to Cloudinary. URL: ${secure_url}`);

          // Remove local temp file
          try {
            await fs.promises.unlink(filePath);
          } catch (e) {
            // ignore
          }
        } catch (genErr) {
          console.error(`Failed to regenerate/upload invoice ${invoice.invoiceNumber}:`, genErr.message);
        }
      }
    }

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  }
}

migrate();
