import express from "express";
import {
  getMechanicProfile,
  getAllMechanics,
  updateMechanic,
  deleteMechanic,
  getMechanicServices,
} from "../controllers/mechanic.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(auth); // Must be logged in

// Only owners or staff can view profiles
router.get("/profile", getMechanicProfile);
router.get("/profile/:id", getMechanicProfile);
router.get("/my-services", auth, getMechanicServices);
// Only owners/admin/advisors with staff visibility should list all mechanics
router.get("/all", authorize("view_staff"), getAllMechanics);
router.put("/:id", authorize("all"), updateMechanic);
router.delete("/:id", authorize("all"), deleteMechanic);

export default router;
