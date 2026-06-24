import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getServiceCatalog,
  addToCatalog,
  getLabourSettings,
  updateCatalogItem,
  deleteFromCatalog,
} from "../controllers/serviceCatalog.controller.js";

const router = express.Router();

router.get("/", auth, getServiceCatalog);
router.post("/", auth, addToCatalog);
router.get("/labour-settings", auth, getLabourSettings);
router.put("/:id", auth, updateCatalogItem);
router.delete("/:id", auth, deleteFromCatalog);

export default router;
