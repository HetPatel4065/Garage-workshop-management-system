import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    vehicleSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleSale",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

wishlistSchema.index({ customerId: 1, vehicleSaleId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
