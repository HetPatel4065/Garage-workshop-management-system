import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  auth,
  requireRole,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import {
  createListing,
  getOwnerListings,
  updateListing,
  deleteListing,
  getMarketplaceListings,
  getMarketplaceVehicleDetails,
  getMarketplaceWishlistCount,
} from "../controllers/vehicleSale.controller.js";

const router = express.Router();

// Ensure upload directory exists (absolute path to avoid CWD-dependent ENOENT errors)
const uploadDir = path.join(__dirname, "..", "uploads", "vehicles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  },
});

// 🏪 PUBLIC / CUSTOMER MARKETPLACE ROUTES (optional auth enriches wishlist data)
router.get("/marketplace", optionalAuth, getMarketplaceListings);
router.get(
  "/marketplace/:id/wishlist-count",
  optionalAuth,
  getMarketplaceWishlistCount,
);
router.get("/marketplace/:id", optionalAuth, getMarketplaceVehicleDetails);

const uploadPhotos = upload.fields([
  { name: "photos", maxCount: 100 },
  { name: "photos[]", maxCount: 100 },
]);

// ️ OWNER LISTING MANAGEMENT ROUTES (Protected by Auth & Role)
router.post(
  "/",
  auth,
  requireRole("admin", "owner"),
  uploadPhotos,
  createListing,
);

// Get listings for the currently authenticated owner/admin
router.get(
  "/my-listings",
  auth,
  requireRole("admin", "owner"),
  getOwnerListings,
);
router.put(
  "/:id",
  auth,
  requireRole("admin", "owner"),
  uploadPhotos,
  updateListing,
);
router.delete("/:id", auth, requireRole("admin", "owner"), deleteListing);

export default router;
