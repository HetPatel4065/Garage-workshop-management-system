import Owner from "../models/Owner.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

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
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }
      try {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: `garage_logos/${req.user.id}`,
        });
        if (uploaded && uploaded.secure_url)
          updateData.logo = uploaded.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed for owner settings logo:", err);
        updateData.logo = req.file.path.replace(/\\/g, "/");
      }
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    const owner = await Owner.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!owner) return res.status(404).json({ error: "Owner not found" });

    res.status(200).json({
      message: "Settings updated successfully",
      owner,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Update failed" });
  }
};
