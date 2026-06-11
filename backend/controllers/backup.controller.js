import { Parser } from "json2csv";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import Service from "../models/Service.js";
import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import Inventory from "../models/Inventory.js";
import JobCard from "../models/JobCard.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import Owner from "../models/Owner.js";
import GarageSettings from "../models/GarageSettings.js";
import csv from "csv-parser";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import { logActivity } from "../utils/activityLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📥 GENERATE BACKUP CONTROLLER
export const generateBackup = async (req, res) => {
  try {
    const { range } = req.query;
    const ownerId = req.user.effectiveOwnerId;
    
    let serviceInvoiceFilter = { ownerId };
    let jobCardFilter = { garageId: ownerId };
    let rangeText = range === "all" ? "all_time" : `${range || 7}_days`;
    
    if (range !== "all") {
      const days = parseInt(range) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      serviceInvoiceFilter.createdAt = { $gte: startDate };
      jobCardFilter.$or = [
        { serviceDate: { $gte: startDate } },
        { createdAt: { $gte: startDate } }
      ];
    }

    // 1. Fetch Data
    const [services, invoices, payments, customers, inventory, advisors, mechanics, vehicles, jobcards, owner, settings] = await Promise.all([
      Service.find(serviceInvoiceFilter).lean(),
      Invoice.find(serviceInvoiceFilter).lean(),
      Invoice.find({ ...serviceInvoiceFilter, amountPaid: { $gt: 0 } }).lean(),
      Customer.find({ ownerId }).lean(),
      Inventory.find({ ownerId }).lean(),
      Advisor.find({ ownerId }).lean(),
      Mechanic.find({ ownerId }).lean(),
      Vehicle.find({ garageId: ownerId }).lean(),
      JobCard.find(jobCardFilter).lean(),
      Owner.findById(ownerId).lean(),
      GarageSettings.findOne({ ownerId }).lean()
    ]);

    const entities = [
      { name: "services", data: services },
      { name: "invoices", data: invoices },
      { name: "payments", data: payments },
      { name: "customers", data: customers },
      { name: "vehicles", data: vehicles },
      { name: "inventory", data: inventory },
      { name: "jobcards", data: jobcards },
      { name: "advisors", data: advisors },
      { name: "mechanics", data: mechanics },
      { name: "owner", data: owner ? [owner] : [] },
      { name: "settings", data: settings ? [settings] : [] },
    ];

    // 2. Flatten Logic
    const flattenData = (data) => {
      return data.map((item) => {
        const flattened = {};
        for (const key in item) {
          if (key === "ownerId") continue;
          const val = item[key];
          
          if (val && typeof val === "object" && (val._bsontype === "ObjectID" || (val.constructor && (val.constructor.name === "ObjectId" || val.constructor.name === "ObjectID")))) {
            flattened[key] = val.toString();
          } else if (Array.isArray(val) || (typeof val === "object" && val !== null && !(val instanceof Date))) {
            flattened[key] = JSON.stringify(val);
          } else {
            flattened[key] = val;
          }
        }
        return flattened;
      });
    };

    // 3. Zip and Stream
    const archive = archiver("zip", { zlib: { level: 9 } });
    const filename = `garage_backup_${rangeText}_${new Date().toISOString().split("T")[0]}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    archive.pipe(res);

    const json2csvParser = new Parser();
    const metadata = {
      backupDate: new Date().toISOString(),
      selectedRange: rangeText,
      totalRecords: {},
    };

    for (const entity of entities) {
      const flattened = flattenData(entity.data);
      if (flattened.length > 0) {
        const csvData = json2csvParser.parse(flattened);
        archive.append(csvData, { name: `${entity.name}.csv` });
      } else {
        archive.append("", { name: `${entity.name}.csv` });
      }
      metadata.totalRecords[entity.name] = entity.data.length;
    }

    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });
    await archive.finalize();
  } catch (error) {
    console.error("Backup Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Backup generation failed" });
    }
  }
};

// 📤 RESTORE BACKUP CONTROLLER
export const restoreBackup = async (req, res) => {
  const zipPath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No backup file uploaded" });
    }

    const ownerId = req.user.effectiveOwnerId;
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const results = { success: true, restored: {}, errors: [] };

    const entityModels = {
      services: Service,
      invoices: Invoice,
      payments: Invoice,
      customers: Customer,
      vehicles: Vehicle,
      inventory: Inventory,
      jobcards: JobCard,
      advisors: Advisor,
      mechanics: Mechanic,
      owner: Owner,
      settings: GarageSettings,
    };

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith(".csv")) {
        const entityName = entry.entryName.replace(".csv", "");
        const Model = entityModels[entityName];

        if (Model) {
          const csvBuffer = entry.getData();
          if (csvBuffer.length === 0) continue;

          const rows = [];
          await new Promise((resolve, reject) => {
            const readable = Readable.from(csvBuffer);
            readable
              .pipe(csv())
              .on("data", (data) => {
                const unflattened = {};
                for (const key in data) {
                  let val = data[key];
                  if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
                    val = val.slice(1, -1);
                  }
                  try {
                    if (val && (val.startsWith("[") || val.startsWith("{"))) {
                      unflattened[key] = JSON.parse(val);
                    } else {
                      unflattened[key] = val;
                    }
                  } catch (e) {
                    unflattened[key] = val;
                  }
                }
                rows.push(unflattened);
              })
              .on("end", resolve)
              .on("error", reject);
          });

          let restoredCount = 0;
          for (const row of rows) {
            try {
              const idField = (entityName === "vehicles" || entityName === "jobcards") ? "garageId" : "ownerId";
              row[idField] = ownerId;
              
              // Clean up ID mismatch
              if (idField === "garageId") delete row.ownerId;
              else delete row.garageId;

              const filter = { [idField]: ownerId };
              
              if (row._id) {
                filter._id = row._id;
              } else if (entityName === "invoices" && row.invoiceNumber) {
                filter.invoiceNumber = row.invoiceNumber;
              } else if (entityName === "customers" && row.phone) {
                filter.phone = row.phone;
              } else if (entityName === "vehicles" && row.licensePlate) {
                filter.licensePlate = row.licensePlate;
              } else if (entityName === "inventory" && row.sku) {
                filter.sku = row.sku;
              } else if (entityName === "jobcards" && row.jobCardId) {
                filter.jobCardId = row.jobCardId;
              } else if ((entityName === "advisors" || entityName === "mechanics") && row.email) {
                filter.email = row.email;
              }

              if (entityName === "owner") {
                // Special handling for owner to avoid overwriting sensitive fields accidentally
                const { _id, email, ...updateData } = row;
                // password IS included if present in backup
                await Owner.findByIdAndUpdate(ownerId, updateData);
              } else if (entityName === "settings") {
                const { _id, ...updateData } = row;
                await GarageSettings.findOneAndUpdate({ ownerId }, updateData, { upsert: true });
              } else {
                await Model.findOneAndUpdate(filter, row, { upsert: true });
              }
              restoredCount++;
            } catch (err) {
              results.errors.push({ entity: entityName, error: err.message });
            }
          }
          results.restored[entityName] = restoredCount;
        }
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Restore Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Restore operation failed" });
    }
  } finally {
    if (zipPath && fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
};
