import express from "express";
import {
  addVehicle,
  getVehicleById,
  getCustomerVehicles,
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
  uploadChassisPhotoController,
} from "../controllers/vehicle.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", auth, addVehicle);
router.get("/", auth, getAllVehicles);
router.get("/customer/:customerId", auth, getCustomerVehicles);
router.get("/:id", auth, getVehicleById);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);
router.post("/:id/upload-chassis-photo", auth, uploadChassisPhotoController);

export default router;
