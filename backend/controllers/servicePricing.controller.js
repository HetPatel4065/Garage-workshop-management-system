import ServicePricing from "../models/ServicePricing.js";
import { getCarCategory } from "../utils/carCategoryMap.js";

export const getCategoryByModel = async (req, res) => {
  try {
    const { model } = req.query;
    if (!model) return res.status(400).json({ message: "model is required" });
    const category = getCarCategory(model);
    if (!category)
      return res
        .status(404)
        .json({ message: `No category found for "${model}"` });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPricingForServices = async (req, res) => {
  try {
    const { category, services } = req.query;
    if (!category || !services)
      return res
        .status(400)
        .json({ message: "category and services required" });

    const serviceList = services
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const pricing = await ServicePricing.find({
      carCategory: category,
      serviceName: { $in: serviceList },
    });

    const map = {};
    pricing.forEach((p) => {
      map[p.serviceName] = { minPrice: p.minPrice, maxPrice: p.maxPrice };
    });

    res.json({ success: true, data: map });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllPricing = async (req, res) => {
  try {
    const all = await ServicePricing.find().sort({
      carCategory: 1,
      serviceName: 1,
    });
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const upsertPricing = async (req, res) => {
  try {
    const { carCategory, serviceName, minPrice, maxPrice } = req.body;
    if (!carCategory || !serviceName || minPrice == null || maxPrice == null)
      return res
        .status(400)
        .json({
          message: "carCategory, serviceName, minPrice, maxPrice required",
        });

    const doc = await ServicePricing.findOneAndUpdate(
      { carCategory, serviceName },
      { minPrice, maxPrice },
      { upsert: true, new: true },
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePricing = async (req, res) => {
  try {
    await ServicePricing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
