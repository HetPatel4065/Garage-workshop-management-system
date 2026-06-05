import Service from "../models/Service.js";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Inventory from "../models/Inventory.js";
import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";
import Vehicle from "../models/Vehicle.js";
import JobCard from "../models/JobCard.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import bcrypt from "bcryptjs";
import { sendEmail, buildDailyReportEmail } from "../utils/notifications.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

// 📊 EXPORT DATA
export const exportData = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { range } = req.query;

    let serviceInvoiceFilter = { ownerId };
    let jobCardFilter = { garageId: ownerId };

    if (range && range !== "all") {
      const days = parseInt(range) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      serviceInvoiceFilter.createdAt = { $gte: startDate };
      jobCardFilter.$or = [
        { serviceDate: { $gte: startDate } },
        { createdAt: { $gte: startDate } },
      ];
    }

    const [customers, services, invoices, inventory, vehicles, jobCards] =
      await Promise.all([
        Customer.find({ ownerId }),
        Service.find(serviceInvoiceFilter)
          .populate("customerId")
          .populate("vehicleId")
          .populate("advisorId"),
        Invoice.find(serviceInvoiceFilter)
          .populate("customerId")
          .populate("serviceId"),
        Inventory.find({ ownerId }),
        Vehicle.find({ garageId: ownerId }).populate("customerId"),
        JobCard.find(jobCardFilter)
          .populate("customerId")
          .populate("vehicleId")
          .populate("advisorId"),
      ]);

    if (req.query.format === "json") {
      await GarageSettings.findOneAndUpdate(
        { ownerId },
        { $set: { lastExportedAt: new Date() } },
        { upsert: true },
      );
      return res.status(200).json({
        customers,
        services,
        invoices,
        inventory,
        vehicles,
        jobCards,
      });
    }

    let csv = "Type,ID,Details,Amount,Date\n";

    customers.forEach(
      (c) =>
        (csv += `Customer,${c.customerId},${c.name} - ${c.phone},0,${c.createdAt}\n`),
    );
    services.forEach(
      (s) =>
        (csv += `Service,${s.serviceId || s._id},"${s.vehicleNumber} - ${s.status}",0,${s.createdAt}\n`),
    );
    invoices.forEach(
      (i) =>
        (csv += `Invoice,${i.invoiceNumber},"${i.customerName || "N/A"}",${i.total},${i.createdAt}\n`),
    );
    inventory.forEach(
      (iv) =>
        (csv += `Inventory,${iv.sku || iv._id},"${iv.name} (Supplier: ${iv.supplier?.name || "N/A"}, Stock: ${iv.stock})",${iv.retailPrice},${iv.updatedAt || iv.createdAt}\n`),
    );
    vehicles.forEach(
      (v) =>
        (csv += `Vehicle,${v.vehicleId || v._id},"${v.make} ${v.model}",0,${v.createdAt}\n`),
    );
    jobCards.forEach(
      (j) =>
        (csv += `JobCard,${j.jobCardId || j._id},"${j.customerName}",0,${j.createdAt}\n`),
    );

    // Track last export time
    await GarageSettings.findOneAndUpdate(
      { ownerId },
      { $set: { lastExportedAt: new Date() } },
      { upsert: true },
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=garage_export_${Date.now()}.csv`,
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("EXPORT ERROR:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
};

// 📝 GET SETTINGS
export const getSettings = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;

    let settings = await GarageSettings.findOne({ ownerId });
    if (!settings) {
      settings = await GarageSettings.create({
        ownerId,
        labourCharges: 0,
        gstRate: 18,
      });
    }

    const owner = await Owner.findById(ownerId).select(
      "name email garageId garageName address mobileNumber logo note laborPrices",
    );

    const response = {
      ...settings.toObject(),
      garageName: settings.garageName || owner?.garageName || "",
      address: settings.businessAddress || owner?.address || "",
      mobileNumber: settings.contactNumber || owner?.mobileNumber || "",
      logo: owner?.logo || "",
      invoiceLogo: settings.invoiceLogo || "",
      gstNumber: settings.gstNumber || "",
      upiId: settings.upiId || "",
      whatsappNumber: settings.whatsappNumber || "",
      isGstInclusive: settings.isGstInclusive || false,
      igstRate: settings.igstRate || 18,
      notifications: settings.notifications || {
        emailReports: false,
        lowStock: false,
        smsReminders: false,
        serviceReminders: false,
      },
      defaultDiscountPercent: settings.defaultDiscountPercent || 0,
      security: settings.security || {
        twoFactorAuth: false,
        loginAlerts: true,
      },
      lastExportedAt: settings.lastExportedAt || null,
      name: owner?.name || "",
      email: owner?.email || "",
      garageId: owner?.garageId || "",
      note: owner?.note || "",
      laborPrices: owner?.laborPrices || [],
      canEdit: ["owner", "admin"].includes(req.user.role),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch garage settings" });
  }
};

// ✏️ UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const {
      labourCharges,
      gstRate,
      isGstInclusive,
      name,
      email,
      garageName,
      address,
      mobileNumber,
      note,
      laborPrices,
      gstNumber,
      upiId,
      whatsappNumber,
      notifications,
      security,
      defaultDiscountPercent,
      logoRemoved,
    } = req.body;

    // Parse JSON strings (sent via FormData)
    let parsedNotifications = notifications;
    if (typeof notifications === "string") {
      try {
        parsedNotifications = JSON.parse(notifications);
      } catch {
        parsedNotifications = undefined;
      }
    }

    let parsedSecurity = security;
    if (typeof security === "string") {
      try {
        parsedSecurity = JSON.parse(security);
      } catch {
        parsedSecurity = undefined;
      }
    }

    let parsedLaborPrices = laborPrices;
    if (typeof laborPrices === "string") {
      try {
        parsedLaborPrices = JSON.parse(laborPrices);
      } catch {
        parsedLaborPrices = [];
      }
    }

    const settingsUpdate = {};
    if (labourCharges !== undefined)
      settingsUpdate.labourCharges = Number(labourCharges);
    if (gstRate !== undefined) settingsUpdate.gstRate = Number(gstRate);
    if (isGstInclusive !== undefined)
      settingsUpdate.isGstInclusive =
        isGstInclusive === "true" || isGstInclusive === true;

    if (garageName !== undefined) settingsUpdate.garageName = garageName;
    if (address !== undefined) settingsUpdate.businessAddress = address;
    if (mobileNumber !== undefined) settingsUpdate.contactNumber = mobileNumber;
    if (gstNumber !== undefined) settingsUpdate.gstNumber = gstNumber;
    if (upiId !== undefined) settingsUpdate.upiId = upiId;
    if (whatsappNumber !== undefined)
      settingsUpdate.whatsappNumber = whatsappNumber;

    if (parsedNotifications !== undefined)
      settingsUpdate.notifications = parsedNotifications;
    if (parsedSecurity !== undefined) settingsUpdate.security = parsedSecurity;
    if (defaultDiscountPercent !== undefined)
      settingsUpdate.defaultDiscountPercent = Number(defaultDiscountPercent);

    // Handle SMTP config if sent
    if (req.body.smtp) {
      try {
        settingsUpdate.smtp =
          typeof req.body.smtp === "string"
            ? JSON.parse(req.body.smtp)
            : req.body.smtp;
      } catch (err) {
        console.error("SMTP Parse Error:", err);
      }
    }

    const clearLogo = logoRemoved === "true" || logoRemoved === true;

    if (req.files) {
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }

      if (req.files.logo && req.files.logo[0]) {
        const filePath = req.files.logo[0].path;
        try {
          const uploaded = await cloudinary.uploader.upload(filePath, {
            folder: `garage_logos/${ownerId}`,
          });
          settingsUpdate.logo =
            uploaded?.secure_url || filePath.replace(/\\/g, "/");
        } catch (err) {
          console.error("Cloudinary upload failed for settings logo:", err);
          settingsUpdate.logo = filePath.replace(/\\/g, "/");
        }
        try {
          await fs.unlink(filePath);
        } catch (e) {}
      }
      if (req.files.invoiceLogo && req.files.invoiceLogo[0]) {
        const filePath = req.files.invoiceLogo[0].path;
        try {
          const uploaded = await cloudinary.uploader.upload(filePath, {
            folder: `garage_logos/${ownerId}`,
          });
          settingsUpdate.invoiceLogo =
            uploaded?.secure_url || filePath.replace(/\\/g, "/");
        } catch (err) {
          console.error("Cloudinary upload failed for invoice logo:", err);
          settingsUpdate.invoiceLogo = filePath.replace(/\\/g, "/");
        }
        try {
          await fs.unlink(filePath);
        } catch (e) {}
      }
    }

    if (clearLogo && !req.files.logo) {
      settingsUpdate.logo = "";
    }

    const settings = await GarageSettings.findOneAndUpdate(
      { ownerId },
      { $set: settingsUpdate },
      { new: true, upsert: true },
    );

    const ownerUpdate = {};
    if (name !== undefined) ownerUpdate.name = name;
    if (email !== undefined) ownerUpdate.email = email;
    if (garageName !== undefined) ownerUpdate.garageName = garageName;
    if (address !== undefined) ownerUpdate.address = address;
    if (mobileNumber !== undefined) ownerUpdate.mobileNumber = mobileNumber;
    if (note !== undefined) ownerUpdate.note = note;
    if (parsedLaborPrices !== undefined)
      ownerUpdate.laborPrices = parsedLaborPrices;
    if (settingsUpdate.logo !== undefined) {
      ownerUpdate.logo = settingsUpdate.logo;
    }

    if (clearLogo) {
      ownerUpdate.logo = "";
    }

    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      { $set: ownerUpdate },
      { new: true },
    );

    res.status(200).json({
      ...settings.toObject(),
      name: updatedOwner.name,
      email: updatedOwner.email,
      garageName: updatedOwner.garageName,
      address: updatedOwner.address,
      mobileNumber: updatedOwner.mobileNumber,
      logo: updatedOwner.logo,
      note: updatedOwner.note,
      laborPrices: updatedOwner.laborPrices || [],
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);
    res.status(500).json({ error: "Failed to update garage settings" });
  }
};

// 🔐 CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters." });
    }

    const owner = await Owner.findById(ownerId).select("+password");
    if (!owner) return res.status(404).json({ error: "Account not found." });

    const isMatch = await bcrypt.compare(currentPassword, owner.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(12);
    owner.password = await bcrypt.hash(newPassword, salt);
    await owner.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ error: "Failed to change password." });
  }
};

// 🔔 SEND TEST NOTIFICATION
export const sendTestNotification = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { type } = req.body; // "email"
    const [settings, owner] = await Promise.all([
      GarageSettings.findOne({ ownerId }),
      Owner.findById(ownerId).select("name email mobileNumber garageName"),
    ]);

    const results = { email: null, sms: null };

    // We ignore the toggle check here because the user explicitly clicked "Send Test"
    if (type === "email" || type === "both") {
      if (!owner?.email)
        return res.status(400).json({
          error:
            "No email address found for this account. Please update your profile first.",
        });

      const [
        newServices,
        completedServices,
        invoices,
        newCustomers,
        lowStockItems,
        totalVehicles,
        totalJobCards,
        totalAdvisors,
        totalMechanics,
      ] = await Promise.all([
        Service.countDocuments({ ownerId }),
        Service.countDocuments({ ownerId, status: "Completed" }),
        Invoice.find({ ownerId }),
        Customer.countDocuments({ ownerId }),
        Inventory.find({
          ownerId,
          $expr: { $lte: ["$stock", { $ifNull: ["$minLimit", 5] }] },
        }).select("name stock"),
        Vehicle.countDocuments({ garageId: ownerId }),
        JobCard.countDocuments({ garageId: ownerId }),
        Advisor.countDocuments({ ownerId }),
        Mechanic.countDocuments({ ownerId }),
      ]);

      let billingToday = 0;
      let collectedToday = 0;

      invoices.forEach((inv) => {
        billingToday += inv.total || 0;
        collectedToday += inv.amountPaid || 0;
      });

      const html = buildDailyReportEmail({
        garageName: owner.garageName || "Your Garage",
        date: new Date().toLocaleDateString("en-IN", { dateStyle: "long" }),
        stats: {
          newServices,
          completedServices,
          billing: billingToday,
          revenue: collectedToday,
          newCustomers,
          totalCustomers: newCustomers, // Using same count as it doesn't filter by today in test route
          totalVehicles,
          totalJobCards,
          totalStaff: totalAdvisors + totalMechanics,
          lowStockItems: lowStockItems.map(
            (i) => `${i.name} (Qty: ${i.stock})`,
          ),
        },
      });

      console.log(`Attempting to send test email to ${owner.email}...`);
      await sendEmail({
        to: owner.email,
        subject: `Daily Garage Report – ${owner.garageName || "Your Garage"}`,
        html,
      });
      results.email = `Sent to ${owner.email}`;
    }

    if (!results.email) {
      return res.status(200).json({
        message:
          "No notification could be sent. Please check your profile has a valid email address.",
        results,
      });
    }

    res.status(200).json({
      message:
        "Test email processed! Check your inbox and server logs for status.",
      results,
    });
  } catch (error) {
    console.error("TEST NOTIFICATION ERROR:", error);
    res.status(500).json({ error: "Failed to send test notification." });
  }
};

// 🚀 SEND LIVE PROJECT BACKUP TO EMAIL
export const sendLiveBackup = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;

    // 1. Fetch EVERYTHING with proper ID mapping
    const [
      customers,
      services,
      invoices,
      inventory,
      vehicles,
      jobCards,
      advisors,
      mechanics,
      owner,
    ] = await Promise.all([
      Customer.find({ ownerId }),
      Service.find({ ownerId })
        .populate("customerId", "name")
        .populate("vehicleId", "licensePlate"),
      Invoice.find({ ownerId }).populate("customerId", "name"),
      Inventory.find({ ownerId }),
      Vehicle.find({ garageId: ownerId }).populate("customerId", "name"), // Note: garageId
      JobCard.find({ garageId: ownerId })
        .populate("customerId", "name")
        .populate("vehicleId", "licensePlate"), // Note: garageId
      Advisor.find({ ownerId }),
      Mechanic.find({ ownerId }),
      Owner.findById(ownerId).select("name email garageName"),
    ]);

    if (!owner?.email) {
      return res
        .status(400)
        .json({ error: "Owner email not found. Please update your profile." });
    }

    // 2. Calculate Lifetime Financials
    const totalCollected = invoices.reduce(
      (sum, inv) => sum + (Number(inv.amountPaid) || 0),
      0,
    );
    const totalBilled = invoices.reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0,
    );

    // 3. Generate CSV Data with Improved Formatting
    let csvRows = [];
    const clean = (val) => `"${String(val || "N/A").replace(/"/g, '""')}"`;
    const formatDate = (date) => {
      if (!date) return "N/A";
      return `"${new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}"`;
    };

    // --- Customers ---
    csvRows.push("=== CUSTOMER DATABASE ===");
    csvRows.push("Customer ID,Name,Email,Phone,Address,Joined Date");
    customers.forEach((c) =>
      csvRows.push(
        `${c.customerId},${clean(c.name)},${clean(c.email)},${clean(c.phone)},${clean(c.address)},${formatDate(c.createdAt)}`,
      ),
    );
    csvRows.push("");

    // --- Vehicles ---
    csvRows.push("=== VEHICLE REGISTRY ===");
    csvRows.push("Vehicle ID,Make,Model,Year,License Plate,Customer Name");
    vehicles.forEach((v) =>
      csvRows.push(
        `${v.vehicleId || v._id},${clean(v.make)},${clean(v.model)},${v.year || "N/A"},${clean(v.licensePlate)},${clean(v.customerId?.name || v.customerName)}`,
      ),
    );
    csvRows.push("");

    // --- Job Cards ---
    csvRows.push("=== JOB CARDS ===");
    csvRows.push(
      "Job Card ID,Customer Name,License Plate,Status,Problems,Date",
    );
    jobCards.forEach((j) =>
      csvRows.push(
        `${clean(j.jobCardId)},${clean(j.customerId?.name || j.customerName)},${clean(j.vehicleId?.licensePlate || j.licensePlate)},${clean(j.status)},${clean((j.problems || []).join("; "))},${formatDate(j.createdAt)}`,
      ),
    );
    csvRows.push("");

    // --- Services ---
    csvRows.push("=== SERVICE LOGS ===");
    csvRows.push("Service ID,Customer Name,Vehicle Number,Status,Date");
    services.forEach((s) =>
      csvRows.push(
        `${s.serviceId},${clean(s.customerId?.name || s.customerName)},${clean(s.vehicleId?.licensePlate || s.vehicle?.licensePlate || s.vehicleNumber)},${clean(s.status)},${formatDate(s.createdAt)}`,
      ),
    );
    csvRows.push("");

    // --- Invoices ---
    csvRows.push("=== INVOICE RECORDS ===");
    csvRows.push(
      "Invoice Number,Customer Name,Subtotal,GST,Total,Amount Paid,Status,Date",
    );
    invoices.forEach((i) =>
      csvRows.push(
        `${clean(i.invoiceNumber)},${clean(i.customerId?.name || i.customerName)},${i.subTotal || 0},${i.gst || 0},${i.total || 0},${i.amountPaid || 0},${clean(i.status)},${formatDate(i.createdAt)}`,
      ),
    );
    csvRows.push("");

    // --- Inventory ---
    csvRows.push("=== INVENTORY & STOCK ===");
    csvRows.push(
      "SKU,Part Name,Category,Cost Price,Retail Price,Current Stock,Min Limit,Last Updated",
    );
    inventory.forEach((iv) =>
      csvRows.push(
        `${clean(iv.sku)},${clean(iv.name)},${clean(iv.category)},${iv.costPrice || 0},${iv.retailPrice || 0},${iv.stock || 0},${iv.minLimit || 5},${formatDate(iv.updatedAt)}`,
      ),
    );
    csvRows.push("");

    // --- Staff (Advisors & Mechanics) ---
    csvRows.push("=== STAFF DATABASE ===");
    csvRows.push("Role,Name,Email,Joined Date");
    advisors.forEach((a) =>
      csvRows.push(
        `Advisor,${clean(a.name)},${clean(a.email)},${formatDate(a.createdAt)}`,
      ),
    );
    mechanics.forEach((m) =>
      csvRows.push(
        `Mechanic,${clean(m.name)},${clean(m.email)},${formatDate(m.createdAt)}`,
      ),
    );

    const csvContent = csvRows.join("\n");

    // 4. Calculate low stock items
    const lowStockItems = inventory
      .filter((item) => item.stock <= (item.minLimit || 5))
      .map((item) => `${item.name} (Qty: ${item.stock})`);

    // 5. Build Professional Email Content (Matching Daily Report Format)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Backup Report</title>
  <style>
    @media screen and (max-width: 480px) {
      .responsive-td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .mobile-padding {
        padding: 16px !important;
      }
      .mobile-margin-bottom {
        margin-bottom: 12px !important;
        height: 12px !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:0 auto;">
          <tr>
            <td bgcolor="#1e293b" align="center" style="padding:32px 24px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0 0 8px;font-size:24px;color:#ffffff;font-weight:700;">${owner.garageName || "Your Garage"}</h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Live Project Backup &mdash; ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding:24px 32px 0;font-size:15px;color:#475569;">
              <p style="margin:0 0 24px;">Here&rsquo;s a full lifetime summary of your business:</p>
              
              <!-- Stats Grid: 2x2 -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">${customers.length}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">TOTAL CUSTOMERS</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="responsive-td mobile-margin-bottom" width="4%"></td>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">${services.length}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">LIFETIME SERVICES</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#1e40af;">₹${totalBilled.toLocaleString("en-IN")}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:6px;">LIFETIME BILLED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="responsive-td mobile-margin-bottom" width="4%"></td>
                  <td class="responsive-td" width="48%" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;">
                      <tr>
                        <td align="center" style="padding:20px;">
                          <div style="font-size:26px;font-weight:800;color:#166534;">₹${totalCollected.toLocaleString("en-IN")}</div>
                          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#166534;margin-top:6px;">CASH COLLECTED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Other Minor Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;">Vehicles Registered</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${vehicles.length}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 0;color:#64748b;">Job Cards Created</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${jobCards.length}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#64748b;">Staff Members</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#0f172a;">${advisors.length + mechanics.length}</td>
                </tr>
              </table>

             ${
               lowStockItems && lowStockItems.length > 0
                 ? `
              <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; font-size:13px; color:#92400e; margin-bottom:24px;">
                  &#9888;&#65039; <strong>Low Stock Alert:</strong> 
                      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                          ${lowStockItems.map((item) => `<li>${item.name} (Only ${item.stock} left)</li>`).join("")}
                      </ul>
              </div>`
                 : ""
             }
              <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
                Attached is the full database export in CSV format. You can open this file in Excel or Google Sheets to view your complete records.
              </p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" align="center" style="padding:16px 24px;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;font-size:12px;color:#64748b;">
              System Generated Backup &bull; ${new Date().toLocaleString("en-IN")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 5. Send Email with Attachment
    const attachments = [
      {
        filename: `Garage_Backup_${new Date().toISOString().split("T")[0]}.csv`,
        content: csvContent,
      },
    ];

    await sendEmail(
      owner.email,
      `Full Business Audit - ${owner.garageName || "Garage System"}`,
      html,
      attachments,
    );

    res
      .status(200)
      .json({ message: "Backup sent successfully to your registered email!" });
  } catch (error) {
    console.error("LIVE BACKUP ERROR:", error);
    res.status(500).json({ error: "Failed to generate live project report." });
  }
};
