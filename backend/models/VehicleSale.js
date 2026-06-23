import mongoose from "mongoose";

const vehicleSaleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
      required: [true, "Fuel type is required"],
    },
    kmDriven: {
      type: Number,
      required: [true, "Kilometers driven is required"],
    },
    transmission: {
      type: String,
      enum: [
        ...["Manual Transmission (MT)", "Automated Manual Transmission (AMT)"],
        ...["Torque Converter AT", "CVT", "DCT/DSG", "AMT", "e-CVT"],
      ],
      required: [true, "Transmission is required"],
    },
    bodyType: {
      type: String,
      enum: ["Hatchback", "Sedan", "SUV", "MUV", "Minivan", "Coupe"],
      trim: true,
    },
    seats: {
      type: String,
      enum: ["4", "5", "6", "7", "8+"],
      trim: true,
    },
    ownership: {
      type: String,
      enum: ["1st Owner", "2nd Owner", "3rd Owner", "4th Owner+"],
      trim: true,
    },
    rtoCode: {
      type: String,
      trim: true,
    },
    rtoState: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Available", "Booked", "Sold", "Hidden"],
      default: "Available",
    },
    // Advanced Car Specification Fields
    variant: {
      type: String,
      trim: true,
    },
    regYear: {
      type: Number,
    },
    regState: {
      type: String,
      trim: true,
    },
    insuranceValidity: {
      type: String,
      trim: true,
    },
    insuranceType: {
      type: String,
      trim: true,
    },
    rcAvailability: {
      type: String,
      trim: true,
    },
    // Engine & Performance
    engineCapacity: {
      type: String,
      trim: true,
    },
    mileage: {
      type: String,
      trim: true,
    },
    power: {
      type: String,
      trim: true,
    },
    torque: {
      type: String,
      trim: true,
    },
    topSpeed: {
      type: String,
      trim: true,
    },
    drivetrain: {
      type: String,
      trim: true,
    },
    // Condition Details
    accidentHistory: {
      type: String,
      trim: true,
    },
    serviceHistory: {
      type: String,
      trim: true,
    },
    noOfKeys: {
      type: Number,
    },
    tyreCondition: {
      type: String,
      trim: true,
    },
    batteryCondition: {
      type: String,
      trim: true,
    },
    scratchDent: {
      type: String,
      trim: true,
    },
    floodDamage: {
      type: String,
      trim: true,
    },
    paintCondition: {
      type: String,
      trim: true,
    },
    // Features & Comfort
    features: {
      sunroof: { type: Boolean, default: false },
      touchscreen: { type: Boolean, default: false },
      androidAuto: { type: Boolean, default: false },
      appleCarPlay: { type: Boolean, default: false },
      reverseCamera: { type: Boolean, default: false },
      parkingSensors: { type: Boolean, default: false },
      cruiseControl: { type: Boolean, default: false },
      automaticClimateControl: { type: Boolean, default: false },
      leatherSeats: { type: Boolean, default: false },
      alloyWheels: { type: Boolean, default: false },
      abs: { type: Boolean, default: false },
      airbags: { type: Boolean, default: false },
      pushStartButton: { type: Boolean, default: false },
    },
    // Seller Information
    sellerType: {
      type: String,
      trim: true,
    },
    sellerName: {
      type: String,
      trim: true,
    },
    verifiedSeller: {
      type: Boolean,
      default: false,
    },
    sellerPhone: {
      type: String,
      trim: true,
    },
    sellerLocation: {
      type: String,
      trim: true,
    },
    testDriveAvailable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const VehicleSale = mongoose.model("VehicleSale", vehicleSaleSchema);
export default VehicleSale;
