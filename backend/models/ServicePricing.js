import mongoose from "mongoose";

const servicePricingSchema = new mongoose.Schema(
  {
    carCategory: {
      type: String,
      required: true,
      enum: [
        "Hatchback",
        "Sedan",
        "Compact SUV",
        "SUV",
        "MUV",
        "Luxury",
        "Ultra Luxury",
      ],
    },
    serviceName: { type: String, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
  },
  { timestamps: true },
);

servicePricingSchema.index(
  { carCategory: 1, serviceName: 1 },
  { unique: true },
);

const ServicePricing = mongoose.model("ServicePricing", servicePricingSchema);

export default ServicePricing;
