import Mechanic from "../models/Mechanic.js";
import Service from "../models/Service.js";

// 📋 GET MECHANIC PROFILE
export const getMechanicProfile = async (req, res) => {
  try {
    const requestedId = req.params.id || req.user.id;
    const query =
      req.user.role === "mechanic"
        ? { _id: req.user.id }
        : { _id: requestedId, ownerId: req.user.effectiveOwnerId };
    const mechanic = await Mechanic.findOne(query).select("-password").lean();
    if (!mechanic) return res.status(404).json({ error: "Mechanic not found" });
    res.status(200).json(mechanic);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mechanic" });
  }
};

// 📋 GET ALL MECHANICS (FOR OWNER)
export const getAllMechanics = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const mechanics = await Mechanic.find({ ownerId }).select("-password").lean();
    res.status(200).json(mechanics);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mechanics" });
  }
};

// ✏️ UPDATE MECHANIC
export const updateMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOneAndUpdate(
      { _id: req.params.id || req.user.id, ownerId: req.user.effectiveOwnerId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");

    if (!mechanic) return res.status(404).json({ error: "Mechanic not found" });
    res.status(200).json(mechanic);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// ❌ DELETE MECHANIC
export const deleteMechanic = async (req, res) => {
  try {
    const deleted = await Mechanic.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.effectiveOwnerId,
    });
    if (!deleted) return res.status(404).json({ error: "Mechanic not found" });
    res.status(200).json({ message: "Mechanic deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

export const getMechanicServices = async (req, res) => {
  try {
    // 1. Get the mechanic ID from the auth middleware
    const mechanicId = req.user.id; 

    // 2. Find services assigned to this mechanic 
    // .populate() pulls the actual Customer details instead of just an ID
    const services = await Service.find({ assignedMechanic: mechanicId })
      .populate("customerId", "name phone address vehicleDetails")
      .lean();

    if (!services || services.length === 0) {
      return res.status(200).json({ message: "No services assigned yet", data: [] });
    }

    res.status(200).json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assigned services" });
  }
};