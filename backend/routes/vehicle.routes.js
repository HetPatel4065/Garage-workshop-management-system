import express from "express";
const router = express.Router();

import {
  addVehicle,
  getVehicleById,
  getCustomerVehicles,
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller.js";
import { auth } from "../middleware/auth.middleware.js";

router.post("/", auth, addVehicle);
router.get("/", auth, getAllVehicles);
router.get("/customer/:customerId", auth, getCustomerVehicles);
router.get("/:id", auth, getVehicleById);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);

export default router;
