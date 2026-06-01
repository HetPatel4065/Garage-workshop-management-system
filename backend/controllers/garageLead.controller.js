import GarageLead from "../models/GarageLead.js";
import crypto from "crypto";
import { sendGarageOnboardingEmail } from "../utils/email.js";

// 📝 SUBMIT PARTNERSHIP LEAD (Public)
export const createLead = async (req, res) => {
  try {
    const {
      garageName,
      ownerName,
      email,
      mobileNumber,
      city,
      servicesOffered,
      message,
    } = req.body;

    if (!garageName || !ownerName || !email || !mobileNumber || !city) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields." });
    }

    if (
      !servicesOffered ||
      (Array.isArray(servicesOffered) && servicesOffered.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: "Please select at least one service." });
    }

    const lead = await GarageLead.create({
      garageName,
      ownerName,
      email,
      mobileNumber,
      city,
      servicesOffered: Array.isArray(servicesOffered)
        ? servicesOffered
        : [servicesOffered],
      message: message || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Our team will contact you shortly.",
      lead,
    });
  } catch (err) {
    console.error("Create Lead Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to submit partnership request" });
  }
};

// 📋 GET ALL LEADS (Admin Only)
export const getLeads = async (req, res) => {
  try {
    // Admin only check - role is checked by middleware but double check is safe
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const leads = await GarageLead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (err) {
    console.error("Get Leads Error:", err);
    res.status(500).json({ error: "Failed to fetch partnership leads" });
  }
};

// ✏️ UPDATE LEAD STATUS (Admin Only)
export const updateLeadStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "contacted", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    let signupToken = undefined;
    let signupTokenExpires = undefined;

    if (status === "approved") {
      signupToken = crypto.randomBytes(32).toString("hex");
      signupTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    const lead = await GarageLead.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "approved" ? { signupToken, signupTokenExpires } : {}),
      },
      { new: true, runValidators: true },
    );

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (status === "approved") {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const signupLink = `${clientUrl}/owner/register?token=${signupToken}`;

      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error(
          "❌ EMAIL CONFIG ERROR: SMTP_USER or SMTP_PASS not set in .env",
        );
        return res.status(500).json({
          error:
            "Email service not configured. Please set SMTP_USER and SMTP_PASS in environment variables.",
          details:
            "The lead was approved but the onboarding email could not be sent.",
        });
      }

      // Attempt to send email
      const emailSent = await sendGarageOnboardingEmail(
        lead.email,
        lead.ownerName,
        lead.garageName,
        signupLink,
      );

      if (!emailSent) {
        console.error(
          `❌ EMAIL FAILED: Could not send onboarding email to ${lead.email}`,
        );
        return res.status(500).json({
          error: "Failed to send onboarding email.",
          details: `Lead was approved but email to ${lead.email} could not be sent. Check email configuration.`,
          signupLink: signupLink, // Provide backup link to admin
        });
      }

      console.log(`✅ EMAIL SENT: Onboarding email sent to ${lead.email}`);
    }

    res.status(200).json({
      success: true,
      message: `Lead status updated to ${status}`,
      lead,
    });
  } catch (err) {
    console.error("Update Lead Status Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to update lead status" });
  }
};

// 🗑️ DELETE LEAD (Admin Only)
export const deleteLead = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const lead = await GarageLead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (err) {
    console.error("Delete Lead Error:", err);
    res.status(500).json({ error: "Failed to delete lead" });
  }
};
