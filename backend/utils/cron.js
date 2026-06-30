import cron from "node-cron";
import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";
import Service from "../models/Service.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import Invoice from "../models/Invoice.js";
import Inventory from "../models/Inventory.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import JobCard from "../models/JobCard.js";
import ReminderLog from "../models/ReminderLog.js";
import Notification from "../models/Notification.js";
import RequestedCustomer from "../models/RequestedCustomer.js";
import {
  buildDailyReportEmail,
  sendEmail,
  buildServiceReminderEmail,
} from "./notifications.js";
import { sendInspectionReminderToOwner } from "./email.js";
import { emitToOwner } from "./socket.js";

export const initDailyReportCron = () => {
  cron.schedule("0 20 * * *", async () => {
    console.log("[CRON] Running Daily Business Reports...");
    try {
      // 1. Get all garages that have daily reports enabled
      const allSettings = await GarageSettings.find({
        "notifications.emailReports": true,
      });

      for (const settings of allSettings) {
        const ownerId = settings.ownerId;
        const owner = await Owner.findById(ownerId);
        if (!owner?.email) continue;

        // 2. Define Today's Time Boundaries
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 3. Gather Dashboard Statistics in Parallel
        const [
          newServices,
          completedServices,
          invoices,
          newCustomers,
          lowStockItems,
          totalCustomers,
          totalVehicles,
          totalJobCards,
          totalAdvisors,
          totalMechanics,
        ] = await Promise.all([
          Service.countDocuments({
            ownerId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          }),
          Service.countDocuments({
            ownerId,
            status: "Completed",
            updatedAt: { $gte: startOfDay, $lte: endOfDay },
          }),
          Invoice.find({
            ownerId,
            $or: [
              { createdAt: { $gte: startOfDay, $lte: endOfDay } },
              { paidAt: { $gte: startOfDay, $lte: endOfDay } },
            ],
          }),
          Customer.countDocuments({
            ownerId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          }),
          Inventory.find({
            ownerId,
            $expr: { $lte: ["$stock", "$minLimit"] },
          }).select("name"),
          Customer.countDocuments({ ownerId }),
          Vehicle.countDocuments({ garageId: ownerId }),
          JobCard.countDocuments({ garageId: ownerId }),
          Advisor.countDocuments({ ownerId }),
          Mechanic.countDocuments({ ownerId }),
        ]);

        // 4. Calculate Financials
        let billingToday = 0;
        let collectedToday = 0;
        invoices.forEach((inv) => {
          if (inv.createdAt >= startOfDay && inv.createdAt <= endOfDay)
            billingToday += inv.total || 0;
          if (inv.paidAt && inv.paidAt >= startOfDay && inv.paidAt <= endOfDay)
            collectedToday += inv.amountPaid || 0;
        });

        // 5. Build and Send Email
        const html = buildDailyReportEmail({
          garageName: owner.garageName || "Your Garage",
          date: new Date().toLocaleDateString("en-IN", { dateStyle: "long" }),
          stats: {
            newServices,
            completedServices,
            revenue: collectedToday,
            billing: billingToday,
            newCustomers,
            totalCustomers,
            totalVehicles,
            totalJobCards,
            totalStaff: totalAdvisors + totalMechanics,
            lowStockItems: lowStockItems.map((i) => i.name),
          },
        });

        await sendEmail({
          smtpConfig: settings.smtp, // Custom SMTP if configured
          to: owner.email,
          subject: `Daily Business Report – ${owner.garageName || "Your Garage"}`,
          html,
          fromName: settings.garageName || owner.garageName || "Garage Manager",
        });

        console.log(`[CRON] Daily report successfully sent to ${owner.email}`);
      }
    } catch (err) {
      console.error("[CRON ERROR] Daily Report Failure:", err);
    }
  });
};

/**
 * SERVICE REMINDER CRON
 * Runs every day at 8:00 AM
 * Checks all active vehicles and sends reminders based on the schedule.
 */
export const initServiceReminderCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running Professional Service Reminder System...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Get the latest service for each vehicle that is "With Owner"
      const latestServices = await Service.aggregate([
        {
          $match: {
            status: "Completed",
            nextServiceDate: { $exists: true, $ne: null },
          },
        },
        { $sort: { serviceDate: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$vehicleId",
            nextServiceDate: { $first: "$nextServiceDate" },
            customerId: { $first: "$customerId" },
            ownerId: { $first: "$ownerId" },
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "_id",
            foreignField: "_id",
            as: "vehicleInfo",
          },
        },
        {
          $unwind: {
            path: "$vehicleInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "vehicleInfo.status": "With Owner",
          },
        },
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $unwind: {
            path: "$customerInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "owners",
            localField: "ownerId",
            foreignField: "_id",
            as: "garageInfo",
          },
        },
        {
          $unwind: {
            path: "$garageInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      for (const service of latestServices) {
        try {
          const owner = service.garageInfo;
          if (!owner) continue;

          // Fetch settings or use defaults
          let settings = await GarageSettings.findOne({
            ownerId: service.ownerId,
          });

          // If no settings exist, we still want to send reminders by default
          const isEnabled = settings
            ? settings.notifications?.serviceReminders
            : true;
          if (!isEnabled) continue;

          const schedule = settings?.notifications?.reminderSchedule || [
            -7, -3, 0, 3,
          ];
          const nextServiceDate = new Date(service.nextServiceDate);
          nextServiceDate.setHours(0, 0, 0, 0);

          // Calculate days difference
          const diffTime = today - nextServiceDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Check if today matches any scheduled reminder day
          if (schedule.includes(diffDays)) {
            // Avoid duplicate reminders on the same day for the same vehicle
            const alreadySentToday = await ReminderLog.findOne({
              vehicleId: service._id,
              sentAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            });

            if (alreadySentToday) continue;

            const customer = service.customerInfo;
            if (!customer) continue;

            const vehicle = await Vehicle.findById(service._id);
            if (!vehicle) continue;

            // Update Vehicle Reminder Status
            if (diffDays < 0) {
              vehicle.reminderStatus = "Reminder Sent";
            } else if (diffDays === 0) {
              vehicle.reminderStatus = "Reminder Sent";
            } else {
              vehicle.reminderStatus = "Overdue";
            }
            vehicle.lastReminderSentDate = new Date();
            await vehicle.save();

            // 1. Send Automatic Email to Customer
            if (customer.email) {
              const emailHtml = buildServiceReminderEmail({
                customerName: customer.name,
                vehicleNumber: vehicle.licensePlate,
                dueDate: nextServiceDate.toLocaleDateString("en-IN", {
                  dateStyle: "long",
                }),
                garageName:
                  settings?.garageName || owner.garageName || "Your Garage",
                contactNumber:
                  settings?.contactNumber ||
                  owner.phone ||
                  owner.mobileNumber ||
                  "",
              });

              await sendEmail({
                to: customer.email,
                subject: `Service Reminder: ${vehicle.licensePlate} is due soon!`,
                html: emailHtml,
                smtpConfig: settings?.smtp,
                fromName:
                  settings?.garageName || owner.garageName || "Service Center",
              });

              // Log the reminder
              await ReminderLog.create({
                ownerId: owner._id,
                vehicleId: vehicle._id,
                customerId: customer._id,
                type: "Email",
                status: "Sent",
                message: `Automated ${diffDays} day reminder sent to customer (${customer.email})`,
              });
            }

            // 2. Notify Owner (via Email if enabled, otherwise just Dashboard)
            if (owner.email && settings?.notifications?.emailReports) {
              await sendEmail({
                to: owner.email,
                subject: `Service Reminder Sent: ${vehicle.licensePlate} (${customer.name})`,
                html: `
                   <h3>Service Reminder Notification</h3>
                   <p>A ${diffDays === 0 ? "due date" : Math.abs(diffDays) + " day"} service reminder has been automatically sent to your customer:</p>
                   <ul>
                     <li><strong>Customer:</strong> ${customer.name}</li>
                     <li><strong>Vehicle:</strong> ${vehicle.licensePlate} (${vehicle.make} ${vehicle.model})</li>
                     <li><strong>Due Date:</strong> ${nextServiceDate.toLocaleDateString("en-IN", { dateStyle: "long" })}</li>
                   </ul>
                   <p>Status: ${vehicle.reminderStatus}</p>
                 `,
                smtpConfig: settings?.smtp,
                fromName: "Garage System Alert",
              });
            }

            // 2. Create Dashboard Notification for Owner
            let title = "Upcoming Service";
            let msg = `Vehicle ${vehicle.licensePlate} (${customer.name}) is due for service in ${Math.abs(diffDays)} days.`;
            let type = "info";

            if (diffDays === 0) {
              title = "Service Due Today!";
              msg = `Vehicle ${vehicle.licensePlate} (${customer.name}) is due for service TODAY.`;
              type = "warning";
            } else if (diffDays > 0) {
              title = "Service Overdue!";
              msg = `Vehicle ${vehicle.licensePlate} (${customer.name}) is ${diffDays} days OVERDUE.`;
              type = "error";
            }

            const notification = await Notification.create({
              ownerId: owner._id,
              title,
              message: msg,
              type: "service_reminder",
              link: `/reminders`,
            });

            emitToOwner(owner._id, "new_notification", notification);
          }
        } catch (vErr) {
          console.error(
            `[CRON ERROR] Failed processing vehicle ${vehicle._id}:`,
            vErr.message,
          );
        }
      }
      console.log("[CRON] Service Reminders processed successfully.");
    } catch (err) {
      console.error("[CRON ERROR] Service Reminder Failure:", err);
    }
  });
};

/**
 * INSPECTION REMINDER CRON
 * Runs every day at 8:00 AM
 * Checks for today's inspections and notifies owner.
 */
export const initInspectionReminderCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Checking Today's Vehicle Inspections...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // 1. Get all unique ownerIds who have inspections today
      const uniqueOwners = await RequestedCustomer.distinct("ownerId", {
        inspectionDate: { $gte: today, $lte: endOfToday },
        status: { $in: ["pending", "inspection_scheduled"] },
      });

      for (const ownerId of uniqueOwners) {
        const owner = await Owner.findById(ownerId);
        if (!owner?.email) continue;

        // 2. Get today's inspections for this owner
        const todaysInspections = await RequestedCustomer.find({
          ownerId,
          inspectionDate: { $gte: today, $lte: endOfToday },
          status: { $in: ["pending", "inspection_scheduled"] },
        }).sort({ inspectionTime: 1 });

        if (todaysInspections.length > 0) {
          // 3. Send Dashboard Notification
          const notification = await Notification.create({
            ownerId,
            title: "Today's Inspections",
            message: `You have ${todaysInspections.length} vehicle inspections scheduled for today.`,
            type: "info",
            link: "/requested-customers",
          });

          emitToOwner(ownerId, "new_notification", notification);

          // 4. Send Email to Owner
          await sendInspectionReminderToOwner(
            owner.email,
            owner.name,
            owner.garageName || "Your Garage",
            todaysInspections,
          );
        }
      }
      console.log("[CRON] Inspection reminders processed successfully.");
    } catch (err) {
      console.error("[CRON ERROR] Inspection Reminder Failure:", err);
    }
  });
};
