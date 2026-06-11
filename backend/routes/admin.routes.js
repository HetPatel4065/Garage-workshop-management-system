import express from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import {
  getGarages,
  toggleGarageStatus,
  toggleOwnerMemberStatus,
  updateVerificationStatus,
  deleteGarage,
  sendAnnouncement,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply auth and admin-role protection to all admin sub-routes
router.use(auth);
router.use(requireRole("admin"));

// Route mappings
router.get("/garages", getGarages);
router.patch("/garages/:id/status", toggleGarageStatus);
router.patch("/garages/:id/member-status", toggleOwnerMemberStatus);
router.patch("/garages/:id/verification", updateVerificationStatus);
router.delete("/garages/:id", deleteGarage);
router.post("/garages/:id/announcement", sendAnnouncement);

export default router;
