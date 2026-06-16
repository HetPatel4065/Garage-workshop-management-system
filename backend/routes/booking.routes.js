import express from "express";
import { auth, optionalAuth } from "../middleware/auth.middleware.js";
import {
  createBookingRequest,
  getOwnerBookings,
  updateBookingDecision,
  getMyBookings,
  // add delete booking
  deleteBooking,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/vehicle/:id", optionalAuth, createBookingRequest);
router.get("/my", optionalAuth, getMyBookings);
router.get("/owner", auth, getOwnerBookings);
router.patch("/:id/decision", auth, updateBookingDecision);
router.delete("/:id", optionalAuth, deleteBooking);

export default router;
