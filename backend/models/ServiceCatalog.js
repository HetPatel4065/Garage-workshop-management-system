import mongoose from "mongoose";

const serviceCatalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    defaultPrice: {
      type: Number,
      required: [true, "Service price is required"],
    },
    category: {
      type: String,
      enum: ["General", "Periodic", "AC/Electrical", "Body Work", "Denting/Painting", "Other"],
      default: "General",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
  },
  { timestamps: true }
);

const ServiceCatalog = mongoose.model("ServiceCatalog", serviceCatalogSchema);

export default ServiceCatalog;
