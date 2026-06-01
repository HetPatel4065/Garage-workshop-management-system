import ServiceCatalog from "../models/ServiceCatalog.js";
import Owner from "../models/Owner.js";

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
};
