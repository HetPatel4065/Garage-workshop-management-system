import express from "express";
import {
  generateBackup,
  restoreBackup,
} from "../controllers/backup.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer config for ZIP uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `restore_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".zip") {
      return cb(new Error("Only ZIP files are allowed"));
    }
    cb(null, true);
  },
});

// 📥 Backup
router.get("/download", auth, authorize("all"), generateBackup);

// 📤 Restore
router.post(
  "/restore",
  auth,
  authorize("all"),
  upload.single("backup"),
  restoreBackup,
);

export default router;
