import express from "express";
const router = express.Router();
import {
  getAllCustomers,
  getCustomerProfile,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  approveCustomer,
  rejectCustomer
} from "../controllers/customer.controller.js"

import {auth,authorize} from '../middleware/auth.middleware.js'

router.get("/", auth, authorize("view_customers"), getAllCustomers);

router.post("/", auth, authorize("manage_customers"), createCustomer);

router.get("/:id", auth, authorize("view_customers"), getCustomerProfile);
router.put("/:id", auth, authorize("manage_customers"), updateCustomer);

router.delete("/:id", auth, authorize("all"), deleteCustomer);
router.patch("/:id/approve", auth, authorize("manage_customers"), approveCustomer);
router.patch("/:id/reject", auth, authorize("manage_customers"), rejectCustomer);

export default router