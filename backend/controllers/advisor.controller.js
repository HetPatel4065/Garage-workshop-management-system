import Advisor from "../models/Advisor.js";
import { logActivity } from "../utils/activityLogger.js";

// 📋 GET ADVISOR PROFILE
export const getAdvisorProfile = async (req, res) => {
  try {
    const requestedId = req.params.id || req.user.id;
    const query =
      req.user.role === "advisor"
        ? { _id: req.user.id }
        : { _id: requestedId, ownerId: req.user.effectiveOwnerId };
    const advisor = await Advisor.findOne(query).select("-password").lean();
    if (!advisor) return res.status(404).json({ error: "Advisor not found" });
    res.status(200).json(advisor);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch advisor" });
  }
};

// 📋 GET ALL ADVISORS (FOR OWNER)
export const getAllAdvisors = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const advisors = await Advisor.find({ ownerId }).select("-password").lean();
    res.status(200).json(advisors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch advisors" });
  }
};

// ✏️ UPDATE ADVISOR
export const updateAdvisor = async (req, res) => {
  try {
    const advisor = await Advisor.findOneAndUpdate(
      { _id: req.params.id || req.user.id, ownerId: req.user.effectiveOwnerId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");

    if (!advisor) return res.status(404).json({ error: "Advisor not found" });

    await logActivity(
      req,
      "update",
      "Advisor",
      `Updated advisor "${advisor.name}"`,
      advisor._id,
    );
    res.status(200).json(advisor);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// ❌ DELETE ADVISOR
export const deleteAdvisor = async (req, res) => {
  try {
    const deleted = await Advisor.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.effectiveOwnerId,
    });
    if (!deleted) return res.status(404).json({ error: "Advisor not found" });

    await logActivity(
      req,
      "delete",
      "Advisor",
      `Deleted advisor with ID ${req.params.id}`,
      req.params.id,
    );

    res.status(200).json({ message: "Advisor deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
