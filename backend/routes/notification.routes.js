import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  sendServiceReminder,
} from "../controllers/notification.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.post("/service-reminder", auth, sendServiceReminder);
router.patch("/:id/read", auth, markAsRead);
router.patch("/read-all", auth, markAllAsRead);
router.delete("/clear-all", auth, clearAllNotifications);
router.delete("/:id", auth, deleteNotification);

export default router;
