import express from "express";
import {
  getOwnerSettings,
  updateOwnerSettings,
} from "../controllers/owner.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.use(auth); // Must be logged in

// Only owners can manage owner settings
router.get("/settings", authorize("all"), getOwnerSettings);
router.put(
  "/settings",
  authorize("all"),
  upload.single("logo"),
  updateOwnerSettings,
);

export default router;
