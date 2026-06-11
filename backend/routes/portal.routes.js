import express from "express";
import {
  getPublicGarages,
  sendRegistrationOTP,
  registerCustomer,
  sendLoginOTP,
  verifyLoginOTP,
  getCustomerDashboardData,
  getLinkedGarages,
  selectGarage,
  allocateGarage,
  getPortalMe,
  getPortalEligibleCustomers,
  generatePortalInvoicePDF,
  downloadPortalInvoicePDF,
} from "../controllers/portal.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/garages", getPublicGarages);
router.post("/send-otp", sendRegistrationOTP);
router.post("/register", registerCustomer);

router.post("/login-otp", sendLoginOTP);
router.post("/verify-login", verifyLoginOTP);

router.get("/dashboard", auth, getCustomerDashboardData);
router.get("/me", auth, getPortalMe);
router.get("/preview-customers", auth, getPortalEligibleCustomers);
router.get("/linked-garages", auth, getLinkedGarages);
router.post("/select-garage", auth, selectGarage);
router.post("/allocate-garage", auth, allocateGarage);
router.get("/invoices/:id/pdf", auth, generatePortalInvoicePDF);
router.get("/invoices/:id/download-pdf", auth, downloadPortalInvoicePDF);

export default router;
