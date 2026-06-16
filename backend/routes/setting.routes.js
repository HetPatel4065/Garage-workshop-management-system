import express from "express";
import {
  getSettings,
  updateSettings,
  exportData,
  changePassword,
  sendTestNotification,
  sendLiveBackup,
} from "../controllers/settings.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.use(auth); // All settings routes are protected

router.get("/", getSettings);
router.get("/export", exportData);
router.put(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "invoiceLogo", maxCount: 1 },
  ]),
  updateSettings
);
router.post("/change-password", changePassword);
router.post("/test-notification", sendTestNotification);
router.post("/send-live-backup", sendLiveBackup);

export default router;