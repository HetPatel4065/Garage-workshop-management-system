import Notification from "../models/Notification.js";
import { emitToOwner } from "./socket.js";
import { sendEmail } from "./notifications.js";
import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";

/**
 * Creates a notification in the database and emits it via Socket.io.
 * Optionally sends an email if configured in garage settings.
 */
export const createNotification = async ({
  ownerId,
  title,
  subtitle = null,
  message,
  type = "info",
  source = "System",
  link = null,
  forceEmail = false,
}) => {
  try {
    // 1. Create DB Notification
    const notification = await Notification.create({
      ownerId,
      title,
      subtitle,
      message,
      type,
      source,
      link,
    });

    // 2. Emit to Owner via Socket
    emitToOwner(ownerId, "new_notification", notification);

    // 3. Handle Email Notification
    const settings = await GarageSettings.findOne({ ownerId });
    const shouldSendEmail = forceEmail || (
      (type === "service_reminder" && settings?.notifications?.serviceReminders) ||
      (type === "low_stock" && settings?.notifications?.lowStock) ||
      (type === "new_customer" && settings?.notifications?.emailReports) ||
      (type === "billing" && settings?.notifications?.emailReports)
    );

    if (shouldSendEmail) {
      const owner = await Owner.findById(ownerId);
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: `${title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p>${message}</p>
              ${link ? `<a href="${process.env.FRONTEND_URL}${link}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a>` : ""}
              <p style="font-size: 12px; color: #777; margin-top: 20px;">This is an automated project notification from your Garage Management System.</p>
            </div>
          `,
          smtpConfig: settings?.smtp,
          fromName: settings?.garageName || owner.garageName || "Garage Project Alert"
        });
      }
    }

    return notification;
  } catch (err) {
    console.error("[NOTIFY_HELPER_ERROR]", err);
  }
};
