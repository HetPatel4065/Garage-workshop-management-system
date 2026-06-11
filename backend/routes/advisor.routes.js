import express from "express";
import { getAdvisorProfile, getAllAdvisors, updateAdvisor, deleteAdvisor } from "../controllers/advisor.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(auth); // Must be logged in

// Only owners or advisors can view profiles
router.get("/profile", getAdvisorProfile);
router.get("/profile/:id", getAdvisorProfile);

// Only owners can management/view all advisors
router.get("/all", authorize("all"), getAllAdvisors);
router.put("/:id", authorize("all"), updateAdvisor);
router.delete("/:id", authorize("all"), deleteAdvisor);

export default router;
