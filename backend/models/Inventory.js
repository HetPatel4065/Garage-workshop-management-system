import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Part name is required"],
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      required: [true, "SKU/Part Number is required"],
      uppercase: true,
    },
    category: {
      type: String,
      enum: [
        "Engine",
        "Brakes",
        "Suspension",
        "Electrical",
        "Fluids",
        "Tires",
        "Body",
        "Filters",
        "Ignition",
        "Cooling",
        "Other",
      ],
      default: "Other",
    },
    carModel: {
      type: String,
      default: "Universal", // e.g., Honda City, All Models
      trim: true,
      required:[true,"For better "]
    },
    carYear: {
      type: String,
      default: "All Years", // e.g., 2015-2022, 2023
      trim: true,
    },
    // Financials for the Dashboard Stats
    costPrice: {
      type: Number,
      required: true, // What the garage paid
    },
    retailPrice: {
      type: Number,
      required: true, // What the customer pays
    },
    // Stock Management
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    minLimit: {
      type: Number,
      default: 5, // Trigger for the "Low Stock Alert"
    },
    unit: {
      type: String,
      default: "pcs", // e.g., liters, sets, pcs
    },
    supplier: {
      name: String,
      contact: String,
    },
    location: {
      type: String,
      default: "Ahmedabad",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    // Audit Trail: Who touched the stock last?
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: Calculate Profit Margin for the UI
inventorySchema.virtual("profitMargin").get(function () {
  if (!this.retailPrice || !this.costPrice) return 0;
  return ((this.retailPrice - this.costPrice) / this.retailPrice) * 100;
});

// Virtual: Status Badge Logic for the Designer
inventorySchema.virtual("stockStatus").get(function () {
  if (this.stock === 0) return "Out of Stock";
  if (this.stock <= this.minLimit) return "Low Stock";
  return "In Stock";
});

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
