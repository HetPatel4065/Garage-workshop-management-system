import express from "express";
import * as ctrl from "../controllers/servicePricing.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/category", auth, ctrl.getCategoryByModel);
router.get("/for-services", auth, ctrl.getPricingForServices);
router.get("/", auth, ctrl.getAllPricing);
router.post("/", auth, ctrl.upsertPricing);
router.delete("/:id", auth, ctrl.deletePricing);

export default router;
