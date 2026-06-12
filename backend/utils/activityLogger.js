import ActivityLog from "../models/ActivityLog.js";
import Owner from "../models/Owner.js";

export const logActivity = async (
  req,
  action,
  module,
  description,
  targetId = null,
  meta = {},
  overrideGarageId = null, // explicit garageId for cases like adding a new owner
) => {
  try {
    // Resolve the ownerId from the request user
    const ownerId =
      req.user?.effectiveOwnerId ||
      (req.user?.role === "owner" ? req.user?._id || req.user?.id : null);

    let garageId = overrideGarageId;

    if (!garageId) {
      if (!ownerId) return;
      // Get garageId from owner
      const owner = await Owner.findById(ownerId).select("garageId").lean();
      if (!owner?.garageId) return;
      garageId = owner.garageId;
    }

    // If we still don't have an ownerId, try to resolve it from the garageId
    let resolvedOwnerId = ownerId;
    if (!resolvedOwnerId && garageId) {
      const owner = await Owner.findOne({ garageId }).sort({ createdAt: 1 }).select("_id").lean();
      if (!owner) return;
      resolvedOwnerId = owner._id;
    }

    if (!resolvedOwnerId || !garageId) return;

    await ActivityLog.create({
      ownerId: resolvedOwnerId,
      garageId,
      performedBy: {
        userId: req.user._id || req.user.id,
        name: req.user.name,
        role: req.user.isCoOwner ? "co-owner" : req.user.role,
      },
      action,
      module,
      description,
      targetId: targetId ? String(targetId) : undefined,
      meta,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};
