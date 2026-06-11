import ServiceCatalog from "../models/ServiceCatalog.js";
import Owner from "../models/Owner.js";
import { logActivity } from "../utils/activityLogger.js";

// 📝 GET ALL SERVICES IN CATALOG
export const getServiceCatalog = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const catalog = await ServiceCatalog.find({ ownerId });
    res.status(200).json(catalog);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch service catalog" });
  }
};

// ➕ ADD TO CATALOG
export const addToCatalog = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { name, defaultPrice, category, description } = req.body;
    
    const newItem = new ServiceCatalog({
      name,
      defaultPrice,
      category,
      description,
      ownerId
    });

await logActivity(
      req,
      "create",
      "ServiceCatalog",
      `Added "${name}" to service catalog`,
    );  

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to add to catalog" });
  }
};

// 🛠️ GET LABOUR SETTINGS
export const getLabourSettings = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const owner = await Owner.findById(ownerId).select("laborPrices laborRate");
    res.status(200).json(owner);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch labour settings" });
  }
};

// ✏️ UPDATE CATALOG ITEM
export const updateCatalogItem = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { id } = req.params;
    const updated = await ServiceCatalog.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update catalog item" });
  }
  await logActivity(
    req,
    "update",
    "ServiceCatalog",
    `Updated service catalog item with ID ${req.params.id}`,
    req.params.id
  );
};

// ❌ DELETE FROM CATALOG
export const deleteFromCatalog = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { id } = req.params;
    await ServiceCatalog.findOneAndDelete({ _id: id, ownerId });
    res.status(200).json({ message: "Deleted from catalog" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete from catalog" });
  }
  await logActivity(
    req,
    "delete",
    "ServiceCatalog",
    `Deleted service catalog item with ID ${req.params.id}`,
    req.params.id
  );
};
