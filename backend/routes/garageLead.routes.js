import express from "express";
import {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
} from "../controllers/garageLead.controller.js";
import { auth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route to submit interest
router.post("/", createLead);

// Admin-only routes to manage leads
router.get("/", auth, requireRole("admin"), getLeads);
router.patch("/:id", auth, requireRole("admin"), updateLeadStatus);
router.delete("/:id", auth, requireRole("admin"), deleteLead);

export default router;
