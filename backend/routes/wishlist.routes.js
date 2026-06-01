import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  toggleWishlist,
  getMyWishlist,
  getWishlistIds,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.use(auth);

router.post("/toggle", toggleWishlist);
router.get("/", getMyWishlist);
router.get("/ids", getWishlistIds);

export default router;


