import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
    },
    problemId: String,
    advisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisor",
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String },
      role: { type: String }, 
    },
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechanic",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Core Service Info
    serviceName: { type: String, required: true },
    description: String,

    status: {
      type: String,
      enum: ["Pending", "In-progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    vehicle: {
      make: String,
      model: String,
      licensePlate: String,
      chassisnumber: String,
      mileage: String,
      year: String,
      fuelType: String,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },

    notes: String, // Mechanic work/advisor notes

    requestedServices: [
      {
        description: String,
        status: { type: String, enum: ["Pending", "Done"], default: "Pending" },
        notes: String,
      },
    ],
    selectedServices: [
      {
        serviceCatalogId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceCatalog",
        },
        name: String,
        priceAtTimeOfService: { type: Number, default: 0 },
        priceAtTime: { type: Number, default: 0 },
      },
    ],
    partsUsed: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        name: String,
        quantity: { type: Number, default: 1 },
        priceAtTime: { type: Number, default: 0 },
        priceAtTimeOfService: { type: Number, default: 0 },
      },
    ],
    labourCharges: [
      {
        laborType: String,
        labourCost: { type: Number, default: 0 },
        customName: String,
      },
    ],

    // Cost tracking
    cost: { type: Number, default: 0 },
    labourCost: { type: Number, default: 0 },
    labourAtTime: { type: Number, default: 0 },
    billingStatus: { type: String, default: "Unbilled" },

    // Auditing
    workLogs: [
      {
        mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "Mechanic" },
        log: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    startTime: Date,
    endTime: Date,

    // Service Date Tracking
    serviceDate: { type: Date },
    nextServiceDate: { type: Date },

    serviceId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

// Helper to pre-calculate labor sum for backward compatibility
serviceSchema.pre("save", async function (next) {
  // Generate serviceId if new
  if (this.isNew && !this.serviceId) {
    try {
      const lastService = await this.constructor
        .findOne({
          ownerId: this.ownerId,
          serviceId: { $regex: /^SRV-/ },
        })
        .sort({ serviceId: -1 })
        .lean();

      let nextNum = 1000;

      if (lastService?.serviceId) {
        const parts = lastService.serviceId.split("-");
        const lastNum = parseInt(parts[1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      this.serviceId = `SRV-${nextNum}`;
    } catch (err) {
      console.error("Error generating serviceId:", err);
    }
  }

  // Auto-calculate nextServiceDate = serviceDate + 6 months
  if (this.isModified("serviceDate") && this.serviceDate) {
    const next = new Date(this.serviceDate);
    next.setMonth(next.getMonth() + 6);
    this.nextServiceDate = next;
  }

  if (this.labourCharges && this.labourCharges.length > 0) {
    this.labourAtTime = this.labourCharges.reduce(
      (sum, item) => sum + (Number(item.labourCost) || 0),
      0,
    );
    this.labourCost = this.labourAtTime;
  }

  if (this.selectedServices) {
    this.selectedServices.forEach((item) => {
      if (item.priceAtTime && !item.priceAtTimeOfService)
        item.priceAtTimeOfService = item.priceAtTime;
      if (item.priceAtTimeOfService && !item.priceAtTime)
        item.priceAtTime = item.priceAtTimeOfService;
    });
  }

  if (this.partsUsed) {
    this.partsUsed.forEach((item) => {
      if (item.priceAtTime && !item.priceAtTimeOfService)
        item.priceAtTimeOfService = item.priceAtTime;
      if (item.priceAtTimeOfService && !item.priceAtTime)
        item.priceAtTime = item.priceAtTimeOfService;
    });
  }
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
