import express from "express";
const router = express.Router();

import {
  createJobCard,
  getJobCards,
  updateJobCard,
  deleteJobCard,
} from "../controllers/jobcard.controller.js";
import { auth, authorize } from "../middleware/auth.middleware.js";

router.post("/", auth, authorize("create_jobcard"), createJobCard);
router.get("/", auth, getJobCards); // Everyone can view
router.put("/:id", auth, authorize("edit_jobcard"), updateJobCard);
router.delete("/:id", auth, authorize("delete_jobcard"), deleteJobCard);

export default router;
