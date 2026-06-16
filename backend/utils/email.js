import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getGarageEmails } from "./notifications.js";

dotenv.config();

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.error(
      "[EMAIL] SMTP_USER or SMTP_PASS is missing. Please check backend/.env",
    );
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

const transporter = getTransporter();

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Garage Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verification Code for Your Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to Our Garage Portal</h2>
        <p>Thank you for registering with us. Please use the following code to verify your email address:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Garage Management Application. All rights reserved.</p>
      </div>
    `,
  };

  try {
    if (!transporter) return false;
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

export const sendWelcomeEmail = async (
  email,
  name,
  garageName,
  ownerName,
  customDate,
  customTime,
) => {
  const now = new Date();

  // Use custom date/time if provided by owner, otherwise use current server time
  let date = customDate
    ? new Date(customDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  let time = customTime
    ? customTime
    : now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  // If customTime was provided in 24h format from a time input, let's make it look nice
  if (customTime && customTime.includes(":")) {
    const [hours, minutes] = customTime.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    time = `${displayH}:${minutes} ${ampm}`;
  }

  const mailOptions = {
    from: `"${garageName || "Garage Portal"}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Registration Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #28a745; text-align: center;">Registration Approved!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Great news! Your registration with <strong>${garageName || "our garage"}</strong> has been reviewed and approved by ${ownerName || "the owner"}.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">Approval Details:</p>
          <p style="margin: 10px 0 0 0; color: #555;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0 0 0; color: #555;"><strong>Time:</strong> ${time}</p>
        </div>

        <p>Your account is now fully active. You can now visit us or use our digital portal to track your services, view history, and manage your vehicle.</p>
        
        <p style="margin-top: 30px;">Best regards,<br/><strong>${ownerName || "The Team"}</strong><br/>${garageName || "GaragePro System"}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} ${garageName || "GaragePro"}. All rights reserved.</p>
      </div>
    `,
  };

  try {
    if (!transporter) return false;
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const sendInspectionReminderToOwner = async (
  ownerEmail,
  ownerName,
  garageName,
  inspections,
) => {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const inspectionListHtml = inspections
    .map(
      (ins, index) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0;">${index + 1}. <strong>${ins.customerName}</strong></td>
      <td style="padding: 12px 0;">${ins.vehicleNumber}</td>
      <td style="padding: 12px 0; text-align: right;">${ins.inspectionTime}</td>
    </tr>
  `,
    )
    .join("");

  let recipients = [ownerEmail];
  try {
    recipients = await getGarageEmails(ownerEmail);
  } catch (err) {
    console.error("Error fetching garage emails for inspection reminder:", err.message);
  }

  let success = false;
  for (const recipient of recipients) {
    const mailOptions = {
      from: `"Garage Portal" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `Today's Vehicle Inspections - ${dateStr}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <h2 style="color: #007bff; text-align: center;">Today's Vehicle Inspections</h2>
          <p>Hello <strong>${ownerName}</strong>,</p>
          <p>You have scheduled inspections for today, <strong>${dateStr}</strong>, at <strong>${garageName}</strong>.</p>
          
          <table width="100%" style="border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 2px solid #007bff; text-align: left; color: #007bff;">
                <th style="padding: 10px 0;">Customer</th>
                <th style="padding: 10px 0;">Vehicle</th>
                <th style="padding: 10px 0; text-align: right;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${inspectionListHtml}
            </tbody>
          </table>

          <p>Please prepare accordingly and ensure the service bay is ready for these inspections.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/requested-customers" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Requested Customers</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} ${garageName}. All rights reserved.</p>
        </div>
      `,
    };

    try {
      if (!transporter) continue;
      await transporter.sendMail(mailOptions);
      success = true;
    } catch (error) {
      console.error(`Error sending inspection reminder email to ${recipient}:`, error);
    }
  }
  return success;
};

export const sendRejectionEmail = async (email, name, garageName, reason) => {
  const mailOptions = {
    from: `"${garageName || "Garage Portal"}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Update on Your Registration Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #dc3545; text-align: center;">Registration Request Update</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for your interest in registering with <strong>${garageName || "our garage"}</strong>.</p>
        
        <p>After reviewing your request, we regret to inform you that we are unable to approve your registration at this time.</p>
        
        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #dc3545;">
          <p style="margin: 0; font-weight: bold; color: #c53030;">Reason for rejection:</p>
          <p style="margin: 10px 0 0 0; color: #555;">${reason || "No specific reason provided. Please contact the garage for more details."}</p>
        </div>

        <p>If you believe this is an error or would like to provide more information, please feel free to reach out to us directly.</p>
        
        <p style="margin-top: 30px;">Best regards,<br/><strong>The Team</strong><br/>${garageName || "GaragePro System"}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} ${garageName || "GaragePro"}. All rights reserved.</p>
      </div>
    `,
  };

  try {
    if (!transporter) return false;
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending rejection email:", error);
    return false;
  }
};

export const sendGarageOnboardingEmail = async (
  email,
  ownerName,
  garageName,
  signupLink,
) => {
  const mailOptions = {
    from: `"GaragePro Onboarding" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Approved! Complete Your Garage Registration",
    html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 30px; border-radius: 16px; background-color: #ffffff;">
    
    <!-- Header/Logo Area -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #10b981; display: inline-block; text-align: center; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; margin-bottom: 12px;">
        <span style="color: white; font-size: 24px; font-weight: 800; vertical-align: middle;">G</span>
      </div>
      <h2 style="color: #111827; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">GaragePro</h2>
      <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Workshop Operating System</p>
    </div>
    
    <!-- Body Content -->
    <h3 style="color: #111827; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Congratulations ${ownerName}!</h3>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      We are pleased to inform you that your partnership request for <strong>${garageName}</strong> has been reviewed and <strong>approved</strong> by the platform administration!
    </p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
      To complete your registration, claim your 10-digit Garage ID, and set up your secure owner login credentials, please click the secure link below:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signupLink}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
        Complete Onboarding Now
      </a>
    </div>
    
    <!-- Fallback Link -->
    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin-bottom: 16px; text-align: center;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${signupLink}" style="color: #10b981; word-break: break-all; text-decoration: underline;">${signupLink}</a>
    </p>
    
    <!-- Expiration Warning -->
    <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-top: 24px; text-align: center; font-style: italic;">
      * This secure registration token will expire in 7 days.
    </p>
    
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
    
    <!-- Footer -->
    <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
      &copy; ${new Date().getFullYear()} GaragePro Platform. All rights reserved.
    </p>
  </div>
`,
  };

  try {
    if (!transporter) return false;
    await transporter.sendMail(mailOptions);
    console.log(`✅ Onboarding email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Error sending garage onboarding email to ${email}:`,
      error.message,
    );
    return false;
  }
};
