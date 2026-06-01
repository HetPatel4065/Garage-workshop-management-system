import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";

const toId = (value) => String(value?._id || value);

export const getWishlistedIdsForCustomer = async (
  customerId,
  vehicleIds = [],
) => {
  if (!customerId) return new Set();

  const filter = {
    customerId: new mongoose.Types.ObjectId(customerId),
  };

  if (vehicleIds.length) {
    filter.vehicleSaleId = {
      $in: vehicleIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  const rows = await Wishlist.find(filter).select("vehicleSaleId").lean();

  return new Set(rows.map((r) => toId(r.vehicleSaleId)));
};

export const enrichListingDoc = (listing, { wishlistedIds = new Set() }) => {
  const doc =
    typeof listing.toObject === "function"
      ? listing.toObject()
      : { ...listing };

  const id = toId(doc._id);

  return {
    ...doc,
    isWishlisted: wishlistedIds.has(id),
  };
};

export const enrichMarketplaceListings = async (
  listings = [],
  customerId = null,
) => {
  if (!listings.length) return [];

  const vehicleIds = listings.map((l) => l._id);

  // Logged-in user's wishlisted vehicles
  const wishlistedIds = customerId
    ? await getWishlistedIdsForCustomer(customerId, vehicleIds)
    : new Set();

  // Total wishlist count per vehicle
  const wishlistCounts = await Wishlist.aggregate([
    {
      $match: {
        vehicleSaleId: {
          $in: vehicleIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    {
      $group: {
        _id: "$vehicleSaleId",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map();

  wishlistCounts.forEach((item) => {
    countMap.set(toId(item._id), item.count);
  });

  return listings.map((listing) => {
    const doc = enrichListingDoc(listing, {
      wishlistedIds,
    });

    return {
      ...doc,
      wishlistCount: countMap.get(toId(listing._id)) || 0,
    };
  });
};
