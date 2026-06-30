import express from "express";
import {
  getCategoryByModel,
  getPricingForServices,
  getAllPricing,
  upsertPricing,
  deletePricing,
} from "../controllers/servicePricing.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/category", auth, getCategoryByModel);
router.get("/for-services", auth, getPricingForServices);
router.get("/", auth, getAllPricing);
router.post("/", auth, upsertPricing);
router.delete("/:id", auth, deletePricing);

export default router;
