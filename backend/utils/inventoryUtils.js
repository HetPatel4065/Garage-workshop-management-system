import GarageSettings from "../models/GarageSettings.js";
import Owner from "../models/Owner.js";
import { sendEmail } from "./notifications.js";
import { createNotification } from "./notificationHelper.js";

// Original method kept as requested by user
export const notifyLowStock = async (ownerId, item) => {
  if (!item || !ownerId) return;

  if (item.stock <= (item.minLimit ?? 5)) {
    try {
      const settings = await GarageSettings.findOne({ ownerId });

      // Only proceed if low stock notifications are enabled in settings
      if (settings?.notifications?.lowStock) {
        const owner = await Owner.findById(ownerId).select("name email mobileNumber garageName");
        const garageName = owner?.garageName || "Your Garage";

        if (owner?.email) {
          await sendEmail({
            to: owner.email,
            subject: `⚠️ Low Stock Alert: ${item.name}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background: #fef2f2;">
              <h2 style="color: #991b1b; margin-top: 0;">Low Stock Alert</h2>
              <p style="font-size: 16px; color: #4b5563;">
                The stock for <strong>${item.name}</strong> has reached a low level.
              </p>
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #fca5a5;">
                <p style="margin: 5px 0;"><strong>Part Name:</strong> ${item.name}</p>
                <p style="margin: 5px 0;"><strong>Vehicle Compatibility:</strong> ${item.carModel || "Universal"} (${item.carYear || "All Years"})</p>
                <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${item.stock}</p>
                <p style="margin: 5px 0;"><strong>Min Limit:</strong> ${item.minLimit ?? 5}</p>
                <p style="margin: 5px 0;"><strong>SKU/Part No:</strong> ${item.sku || "N/A"}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">Please restock this item soon to avoid service delays.</p>
            </div>`
          });
          console.log(`[NOTIFY] Low stock email sent to ${owner.email} for ${item.name}`);
        }
      }
    } catch (notifErr) {
      console.error("[NOTIFY] Low-stock notification error:", notifErr.message);
    }
  }
};

// New method for in-app and real-time notifications
export const createLowStockNotification = async (ownerId, item) => {
  if (!item || !ownerId) return;

  console.log(`[DEBUG] Checking stock for ${item.name}: ${item.stock} / ${item.minLimit ?? 5}`);
  if (item.stock <= (item.minLimit ?? 5)) {
    console.log(`[DEBUG] Item ${item.name} is low stock. Creating notification...`);
    try {
      await createNotification({
        ownerId,
        title: `⚠️ Low Stock Alert: ${item.name}`,
        message: `The stock for ${item.name} has reached ${item.stock} ${item.unit || 'pcs'}. Min limit is ${item.minLimit ?? 5}.`,
        type: "low_stock",
        link: `/inventory?q=${encodeURIComponent(item.name)}`
      });
      console.log(`[NOTIFY] In-app low stock notification created for ${item.name}`);
    } catch (notifErr) {
      console.error("[NOTIFY] In-app low-stock notification error:", notifErr.message);
    }
  }
};
