import express from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import { getActivityLog, getMyActivityLog } from "../controllers/activityLog.controller.js";

const router = express.Router();

router.use(auth);

// Owner sees their own garage activity
router.get("/mine", getMyActivityLog);

// Admin sees any garage activity
router.get("/:garageId", requireRole("admin"), getActivityLog);

export default router;