import express from "express";
const router = express.Router();
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  getStaff,
  removeStaff,
  updateStaff,
  removeAnyUser,
  getLeadDetailsByToken,
  completeOwnerOnboarding,
} from "../controllers/auth.controller.js";
import {
  auth,
  authorize,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import multer from "multer";
import fs from "fs";
// Add these imports at the top with the others:
import {
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.post("/register", upload.single("logo"), optionalAuth, register);

router.post("/login", login);
router.post("/refresh", refreshToken);

router.get("/me", auth, getMe);
router.get("/staff", auth, authorize("view_staff"), getStaff);
router.put("/staff/:staffId", auth, authorize("manage_staff"), updateStaff);
router.delete("/staff/:staffId", auth, authorize("manage_staff"), removeStaff);
router.get("/onboarding-details", getLeadDetailsByToken);
router.post("/complete-onboarding", completeOwnerOnboarding);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.delete("/remove-user/:id", auth, removeAnyUser); // Admin Only
router.post("/logout", auth, logout);

export default router;
