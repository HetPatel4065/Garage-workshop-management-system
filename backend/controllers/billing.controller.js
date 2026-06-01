import Invoice from "../models/Invoice.js";
import { createNotification } from "../utils/notificationHelper.js";
import Service from "../models/Service.js";
import { calculateInvoiceTotals } from "../utils/calculateInvoice.js";
import { generateAndSaveInvoicePDF } from "../utils/generateInvoice.js";
import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";
import { sendEmail, buildDailyReportEmail } from "../utils/notifications.js";
import Notification from "../models/Notification.js";
import { emitToOwner } from "../utils/socket.js";

// 🧾 CREATE INVOICE DRAFT
export const createInvoiceDraft = async (req, res) => {
  const { serviceId } = req.body;
  const ownerId = req.user.effectiveOwnerId; // Consistent multi-tenancy

  try {
    const service = await Service.findOne({ _id: serviceId, ownerId })
      .populate("customerId")
      .populate("partsUsed.partId")
      .populate("selectedServices.serviceCatalogId");

    if (!service) {
      return res.status(404).json({ error: "Service record not found" });
    }

    // 🛡️ CHECK IF INVOICE ALREADY EXISTS
    const existingInvoice = await Invoice.findOne({ serviceId, ownerId });

    // If invoice exists and is already finalized/paid, just return it
    if (existingInvoice && existingInvoice.status !== "Draft") {
      return res.status(200).json({
        message: "Invoice already exists and is finalized",
        invoice: existingInvoice,
      });
    }

    // 1. Construct parts array from stored priceAtTime
    const parts = (service.partsUsed || []).map((item) => {
      const price = Number(item.priceAtTime || 0);
      const qty = Number(item.quantity) || 0;
      return {
        partId: item.partId?._id || item.partId,
        name: item.name || item.partId?.name || "Part",
        quantity: qty,
        priceSnapshot: price,
        total: price * qty,
      };
    });

    // 2. Construct services array from stored priceAtTime
    const services = (service.selectedServices || []).map((item) => {
      const price = Number(item.priceAtTime || 0);
      return {
        serviceCatalogId: item.serviceCatalogId?._id || item.serviceCatalogId,
        name: item.name || item.serviceCatalogId?.name || "Service",
        priceSnapshot: price,
        total: price,
      };
    });

    // Calculate totals from snapshots (final verification)

    // Fetch garage settings for default discount
    const settings = await GarageSettings.findOne({ ownerId });
    const discountPercent = settings?.defaultDiscountPercent || 0;

    const totals = calculateInvoiceTotals(
      parts.map((p) => ({
        priceAtTimeOfService: p.priceSnapshot,
        quantity: p.quantity,
      })),
      services.map((s) => ({ priceAtTimeOfService: s.priceSnapshot })),
      Number(service.labourAtTime || 0),
      service.totals?.gstRate || 18,
      discountPercent
    );

    const laborInfo = {
      typeOfWork: "General Labour",
      priceSnapshot: Number(service.labourAtTime || 0),
    };

    let invoiceToReturn;

    if (existingInvoice) {
      existingInvoice.parts = parts;
      existingInvoice.services = services;
      existingInvoice.labor = laborInfo;
      existingInvoice.subTotal = totals.subtotal;
      existingInvoice.gst = totals.gst;
      existingInvoice.discountPercent = totals.discountPercent;
      existingInvoice.discountAmount = totals.discountAmount;
      existingInvoice.total = totals.finalTotal;

      await existingInvoice.save();
      invoiceToReturn = existingInvoice;
    } else {
      // Generate Sequential 6-digit Invoice Number (Only for NEW invoices)
      const lastInvoice = await Invoice.findOne({ ownerId }).sort({
        createdAt: -1,
      });
      let nextNum = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/\d+/);
        if (match) {
          nextNum = parseInt(match[0]) + 1;
        }
      }
      const invoiceNumber = `INV-${nextNum.toString().padStart(6, "0")}`;

      const newInvoice = new Invoice({
        invoiceNumber,
        serviceId: service._id,
        customerId: service.customerId._id || service.customerId,
        ownerId,
        parts,
        services,
        labor: laborInfo,
        subTotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        gst: totals.gst,
        total: totals.finalTotal,
        status: "Draft",
      });

      await newInvoice.save();
      invoiceToReturn = newInvoice;
    }

    // Update service billing status
    service.billingStatus = "Invoiced";
    await service.save();

    res.status(existingInvoice ? 200 : 201).json({
      message: existingInvoice ? "Draft invoice updated" : "Draft invoice generated successfully",
      invoice: invoiceToReturn,
    });
  } catch (error) {
    console.error("CRITICAL BILLING ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL INVOICES
export const getAllInvoices = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { filter } = req.query;

    let query = { ownerId };

    // Apply "today" filter
    if (filter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    const invoices = await Invoice.find(query)
      .populate("customerId")
      .populate({
        path: "serviceId",
        populate: [
          { path: "partsUsed.partId" },
          { path: "vehicleId" }
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

// GET INVOICE BY ID
export const getInvoiceById = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const invoice = await Invoice.findOne({ _id: req.params.id, ownerId })
      .populate("customerId")
      .populate({
        path: "serviceId",
        populate: [
          { path: "partsUsed.partId" },
        ],
      });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

// FINALIZE INVOICE
export const finalizeInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const ownerId = req.user.effectiveOwnerId;
    const invoice = await Invoice.findOne({ _id: id, ownerId });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status === "Paid") {
      return res.status(400).json({ error: "Invoice already settled" });
    }

    invoice.status = "Finalized";
    invoice.finalizedAt = new Date();

    await invoice.save();

    // 📧 Send email report if emailReports notification is ON
    try {
      const settings = await GarageSettings.findOne({ ownerId });
      if (settings?.notifications?.emailReports) {
        const owner = await Owner.findById(ownerId).select("email name garageName");
        if (owner?.email) {
          const html = buildDailyReportEmail({
            garageName: owner.garageName || "Your Garage",
            date: new Date().toLocaleDateString("en-IN", { dateStyle: "long" }),
            stats: {
              newServices: 1,
              completedServices: 1,
              revenue: invoice.total,
              newCustomers: 0,
            },
          });
          await sendEmail({
            to: owner.email,
            subject: `Invoice ${invoice.invoiceNumber} Finalized – ₹${invoice.total}`,
            html
          });
        }
      }
    } catch (notifErr) {
      console.error("[NOTIFY] Email notification error:", notifErr.message);
    }

    // 🔔 Create Dashboard Notification for Unpaid Invoice
    await createNotification({
      ownerId,
      title: "Unpaid Invoice",
      message: `Invoice ${invoice.invoiceNumber} for ₹${invoice.total} has been finalized and is awaiting payment.`,
      type: "unpaid_invoice",
      link: `/billing`
    });

    res.status(200).json({
      message: "Invoice finalized and sent to customer",
      invoice,
    });
  } catch (error) {
    res.status(500).json({ error: "Finalization failed" });
  }
};

// UPDATE INVOICE STATUS (Paid / Partially Paid / Cancelled)
export const updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, amountPaid } = req.body;

  try {
    const ownerId = req.user.effectiveOwnerId;
    const invoice = await Invoice.findOne({ _id: id, ownerId });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (status) invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (amountPaid !== undefined) {
      invoice.amountPaid = Number(amountPaid);

      // Auto-update status based on amountPaid vs total
      if (invoice.amountPaid >= invoice.total) {
        invoice.status = "Paid";
        invoice.paidAt = new Date();
      } else if (invoice.amountPaid > 0) {
        invoice.status = "Partially Paid";
      }
    }

    if (status === "Paid" && !invoice.paidAt) {
      invoice.paidAt = new Date();
      invoice.amountPaid = invoice.total; // Assume full payment if status explicitly set to Paid
    }

    await invoice.save();

    res.status(200).json({
      message: "Invoice payment updated successfully",
      invoice,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update invoice payment" });
  }
};

// DELETE INVOICE
export const deleteInvoice = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.effectiveOwnerId;

  try {
    const invoice = await Invoice.findOne({ _id: id, ownerId });
    if (!invoice) {
      return res
        .status(404)
        .json({ error: "Invoice not found or unauthorized" });
    }

    await Invoice.findByIdAndDelete(id);

    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete Invoice Error:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

// GENERATE & SAVE INVOICE PDF (Server-side, for WhatsApp sharing)
export const generateInvoicePDF = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.effectiveOwnerId;

  try {
    // 1. Fetch fully-populated invoice
    const invoice = await Invoice.findOne({ _id: id, ownerId })
      .populate("customerId")
      .populate({
        path: "serviceId",
        populate: [
          { path: "vehicleId" },
          { path: "partsUsed.partId" },
        ],
      });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // 2. Fetch garage settings and owner profile for branding
    const [settings, owner] = await Promise.all([
      GarageSettings.findOne({ ownerId }),
      Owner.findById(ownerId).select("logo mobileNumber garageName address")
    ]);

    const branding = {
      ...(settings ? settings.toObject() : {}),
      logo: settings?.invoiceLogo || owner?.logo || "",
      mobileNumber: settings?.contactNumber || owner?.mobileNumber || "",
      garageName: settings?.garageName || owner?.garageName || "Garage Name",
      businessAddress: settings?.businessAddress || owner?.address || "Garage Address"
    };

    // 3. Generate PDF and save to /uploads/invoices/
    const relativePath = await generateAndSaveInvoicePDF(invoice, branding);

    // 4. Build the public URL
    const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
    const publicUrl = `${BASE_URL}/uploads/${relativePath}`;

    // 5. Persist the URL on the invoice document
    invoice.pdfUrl = publicUrl;
    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice PDF generated successfully",
      pdfUrl: `${publicUrl}?t=${Date.now()}`,
    });
  } catch (error) {
    console.error("[PDF Generation Error]:", error);
    return res.status(500).json({ error: "Failed to generate invoice PDF" });
  }
};

// 📱 SHARE INVOICE (legacy – upload-based, kept for compatibility)
export const shareInvoice = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.effectiveOwnerId;

  try {
    const invoice = await Invoice.findOne({ _id: id, ownerId });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    const publicUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
    invoice.pdfUrl = publicUrl;
    await invoice.save();
    res.status(200).json({ message: "Invoice link generated", shareLink: publicUrl });
  } catch (error) {
    console.error("Share Invoice Error:", error);
    res.status(500).json({ error: "Failed to generate share link" });
  }
};
