import Wishlist from "../models/Wishlist.js";
import VehicleSale from "../models/VehicleSale.js";
import {
  requirePortalCustomerId,
  resolvePortalCustomerId,
} from "../utils/portalCustomerContext.js";

export const toggleWishlist = async (req, res) => {
  try {
    const customerId = requirePortalCustomerId(req, res);
    if (!customerId) return;

    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res
        .status(400)
        .json({ success: false, error: "vehicleId is required" });
    }

    const vehicle = await VehicleSale.findById(vehicleId).select("_id status");
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, error: "Vehicle not found" });
    }

    const existing = await Wishlist.findOne({
      customerId,
      vehicleSaleId: vehicleId,
    });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        wishlisted: false,
        message: "Removed from wishlist",
      });
    }

    try {
      await Wishlist.create({ customerId, vehicleSaleId: vehicleId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          wishlisted: true,
          message: "Already in wishlist",
        });
      }
      throw err;
    }

    return res.status(200).json({
      success: true,
      wishlisted: true,
      message: "Added to wishlist",
    });
  } catch (error) {
    console.error("TOGGLE WISHLIST ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update wishlist" });
  }
};

export const getMyWishlist = async (req, res) => {
  try {
    const customerId = requirePortalCustomerId(req, res);
    if (!customerId) return;

    const items = await Wishlist.find({ customerId })
      .populate({
        path: "vehicleSaleId",
        populate: [
          {
            path: "ownerId",
            select: "garageName city mobileNumber verificationStatus",
          },
          { path: "customerId", select: "name phone isVerified" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const vehicles = items
      .filter((item) => item.vehicleSaleId)
      .map((item) => ({
        ...item.vehicleSaleId,
        wishlistedAt: item.createdAt,
        isWishlisted: true,
      }));

    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    res.status(500).json({ success: false, error: "Failed to fetch wishlist" });
  }
};

export const getWishlistIds = async (req, res) => {
  try {
    const customerId = resolvePortalCustomerId(req);
    if (!customerId) {
      return res.status(200).json({ success: true, vehicleIds: [] });
    }

    const rows = await Wishlist.find({ customerId })
      .select("vehicleSaleId")
      .lean();
    res.status(200).json({
      success: true,
      vehicleIds: rows.map((r) => String(r.vehicleSaleId)),
    });
  } catch (error) {
    console.error("GET WISHLIST IDS ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch wishlist ids" });
  }
};
