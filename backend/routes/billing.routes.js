import express from "express";
const router = express.Router();
import {
  createInvoiceDraft,
  getInvoiceById,
  getAllInvoices,
  finalizeInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  shareInvoice,
  generateInvoicePDF,
  downloadInvoicePDF,
} from "../controllers/billing.controller.js";
import multer from "multer";
import path from "path";
import { auth, authorize } from "../middleware/auth.middleware.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

router.post(
  "/generate-draft",
  auth,
  authorize("manage_billing"),
  createInvoiceDraft,
);

router.get("/", auth, authorize("view_billing"), getAllInvoices);

router.get("/:id", auth, authorize("view_billing"), getInvoiceById);

router.patch(
  "/:id/finalize",
  auth,
  authorize("manage_billing"),
  finalizeInvoice,
);

router.patch(
  "/:id/payment",
  auth,
  authorize("manage_billing"),
  updateInvoiceStatus,
);

router.delete("/:id", auth, authorize("manage_billing"), deleteInvoice);

router.post(
  "/:id/share",
  auth,
  authorize("manage_billing"),
  upload.single("pdf"),
  shareInvoice,
);

// 🖨️ Generate PDF server-side & return public URL
router.post(
  "/:id/generate-pdf",
  auth,
  authorize("manage_billing"),
  generateInvoicePDF,
);

router.get(
  "/:id/download-pdf",
  auth,
  authorize("manage_billing"),
  downloadInvoicePDF,
);

export default router;
