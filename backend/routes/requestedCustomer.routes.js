import express from "express";
import {
  createRequestedCustomer,
  getAllRequestedCustomers,
  getRequestedCustomerById,
  approveRequestedCustomer,
  rejectRequestedCustomer,
  deleteRequestedCustomer,
  getTodaysInspections,
  updateAppointment,
} from "../controllers/requestedCustomer.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route for customer registration portal
router.post("/register", createRequestedCustomer);

// Protected routes (Owner/Staff)
router.get("/", auth, getAllRequestedCustomers);
router.get("/today", auth, getTodaysInspections);
router.get("/:id", auth, getRequestedCustomerById);

// Owner/Admin only routes
router.patch("/:id/approve", auth, approveRequestedCustomer);
router.patch("/:id/reject", auth, rejectRequestedCustomer);
router.patch("/:id/appointment", auth, updateAppointment);
router.delete("/:id", auth, deleteRequestedCustomer);
export default router;
