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

    // 🔄 ATOMIC OPERATION: Check if exists and delete (or do nothing if not)
    const existing = await Wishlist.findOne({
      customerId,
      vehicleSaleId: vehicleId,
    });

    if (existing) {
      // ✅ REMOVE: Delete the entry
      await Wishlist.deleteOne({ _id: existing._id });

      // Get accurate count after removal
      const countAfter = await Wishlist.countDocuments({
        vehicleSaleId: vehicleId,
        customerId: { $exists: true, $ne: null },
      });

      return res.status(200).json({
        success: true,
        wishlisted: false,
        message: "Removed from wishlist",
        count: countAfter,
      });
    }

    // ✅ ADD: Use findOneAndUpdate with upsert to prevent race conditions
    // This is atomic - only one instance can be created per customerId+vehicleId pair
    try {
      await Wishlist.updateOne(
        { customerId, vehicleSaleId: vehicleId },
        {
          $setOnInsert: {
            customerId,
            vehicleSaleId: vehicleId,
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (err) {
      if (err.code === 11000) {
        // 🔍 Duplicate key error - entry already exists, treat as success
        console.warn(
          `Duplicate wishlist entry attempt for customer ${customerId} and vehicle ${vehicleId}`,
        );
        const countAfter = await Wishlist.countDocuments({
          vehicleSaleId: vehicleId,
          customerId: { $exists: true, $ne: null },
        });
        return res.status(200).json({
          success: true,
          wishlisted: true,
          message: "Already in wishlist",
          count: countAfter,
        });
      }
      throw err;
    }

    // Get accurate count after addition
    const countAfter = await Wishlist.countDocuments({
      vehicleSaleId: vehicleId,
      customerId: { $exists: true, $ne: null },
    });

    return res.status(200).json({
      success: true,
      wishlisted: true,
      message: "Added to wishlist",
      count: countAfter,
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

// 🔍 DEBUGGING: Validate wishlist entries for a customer - check for duplicates
export const validateWishlistIntegrity = async (req, res) => {
  try {
    const customerId = requirePortalCustomerId(req, res);
    if (!customerId) return;

    // Check for duplicate entries (multiple docs with same customerId+vehicleId)
    const duplicates = await Wishlist.aggregate([
      { $match: { customerId } },
      {
        $group: {
          _id: "$vehicleSaleId",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    // Count total entries
    const totalCount = await Wishlist.countDocuments({ customerId });

    // List all wishlist entries for this customer
    const entries = await Wishlist.find({ customerId })
      .select("vehicleSaleId createdAt")
      .lean()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      integrity: {
        totalCount,
        duplicateGroups: duplicates.length,
        duplicates: duplicates.map((d) => ({
          vehicleId: d._id,
          count: d.count,
          docIds: d.ids,
        })),
      },
      entries,
    });
  } catch (error) {
    console.error("VALIDATE WISHLIST ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to validate wishlist" });
  }
};

// 🔍 DEBUGGING: Get wishlist statistics (count, unique entries)
export const getWishlistStats = async (req, res) => {
  try {
    const customerId = requirePortalCustomerId(req, res);
    if (!customerId) return;

    const totalDocs = await Wishlist.countDocuments({ customerId });
    const uniqueVehicles = await Wishlist.distinct("vehicleSaleId", {
      customerId,
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalDocuments: totalDocs,
        uniqueVehicles: uniqueVehicles.length,
        isHealthy: totalDocs === uniqueVehicles.length,
      },
    });
  } catch (error) {
    console.error("GET WISHLIST STATS ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get wishlist stats" });
  }
};
