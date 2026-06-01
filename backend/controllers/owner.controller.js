import Owner from "../models/Owner.js";

// 📋 GET OWNER PROFILE / SETTINGS
export const getOwnerSettings = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select("-password");
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    res.status(200).json(owner);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// ✏️ UPDATE OWNER / GARAGE SETTINGS
export const updateOwnerSettings = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.logo = req.file.path.replace(/\\/g, "/");
    }

    const owner = await Owner.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!owner) return res.status(404).json({ error: "Owner not found" });

    res.status(200).json({
      message: "Settings updated successfully",
      owner
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Update failed" });
  }
};
