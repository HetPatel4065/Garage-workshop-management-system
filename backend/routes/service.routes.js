import express from 'express'
const router = express.Router();
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/service.controller.js'

import { auth, authorize } from '../middleware/auth.middleware.js'

// Anyone can view based on their role restrictions natively in the controller
router.get("/", auth, getAllServices);
router.get("/:id", auth, getServiceById);

// Create restricted to users with permission
router.post("/", auth, authorize("create_service"), createService);

// Update uses edit/status restrictions depending on what is being updated (handled deeply in controller)
router.put("/:id", auth, authorize("edit_service"), updateService);

// Delete restricted
router.delete("/:id", auth, authorize("delete_service"), deleteService);

export default router
