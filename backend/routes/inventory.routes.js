import express from "express";
const router = express.Router();
import {
  getInventory,
  getPartById,
  addPart,
  updateStock,
  updatePart,
  checkAvailability,
  deletePart,
} from "../controllers/inventory.controller.js";

import { auth, authorize } from "../middleware/auth.middleware.js";

router.get("/", auth, authorize("view_inventory"), getInventory);

router.post("/", auth, authorize("manage_inventory"), addPart);

router.post("/check", auth, checkAvailability);

router.get("/:id", auth, authorize("view_inventory"), getPartById);
router.put("/:id", auth, authorize("manage_inventory"), updatePart);

router.patch("/:id/stock", auth, authorize("manage_inventory"), updateStock);

router.delete("/:id", auth, authorize("all"), deletePart);

export default router;
