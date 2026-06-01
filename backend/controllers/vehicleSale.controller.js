import path from "path";
import VehicleSale from "../models/VehicleSale.js";
import Owner from "../models/Owner.js";
import Wishlist from "../models/Wishlist.js";
import Booking from "../models/Booking.js";
import { getIO } from "../utils/socket.js";
import { addWatermark } from "../utils/watermark.js";
import {
  resolvePortalCustomerId,
  requirePortalCustomerId,
} from "../utils/portalCustomerContext.js";
import {
  enrichMarketplaceListings,
  enrichListingDoc,
  getWishlistedIdsForCustomer,
} from "../services/marketplaceEngagement.service.js";

const BODY_TYPE_VALUES = [
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Minivan",
  "Coupe",
];
const SEATS_VALUES = ["4", "5", "6", "7", "8+"];
const OWNERSHIP_VALUES = ["1st Owner", "2nd Owner", "3rd Owner", "4th Owner+"];
const COLOR_VALUES = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Other",
];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeListingColor = (color) => {
  const trimmed = String(color || "").trim();
  if (!trimmed) return trimmed;
  if (COLOR_VALUES.includes(trimmed)) return trimmed;
  const matched = COLOR_VALUES.find((c) =>
    new RegExp(escapeRegex(c), "i").test(trimmed),
  );
  return matched || trimmed;
};

const enrichSpecifications = (specs, { bodyType, seats, ownership }) => {
  const list = Array.isArray(specs)
    ? specs.filter((s) => s?.key?.trim() && s?.value?.trim())
    : [];

  const withoutFacets = [...list];

  if (bodyType) {
    withoutFacets.push({ key: "Body Type", value: bodyType });
  }
  if (seats) {
    withoutFacets.push({ key: "Seating Capacity", value: seats });
  }
  if (ownership) {
    withoutFacets.push({ key: "Ownership", value: ownership });
  }
  return withoutFacets;
};

// 📝 CREATE LISTING (Owner Only)
export const createListing = async (req, res) => {
  try {
    if (!["admin", "owner"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only owners and admins can create vehicle listings" });
    }

    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) {
      return res
        .status(400)
        .json({ error: "Active garage owner context required" });
    }

    const {
      title,
      brand,
      model,
      color,
      year,
      price,
      fuelType,
      kmDriven,
      transmission,
      description,
      bodyType,
      seats,
      ownership,
      rtoCode,
      rtoState,
      status,
      variant,
      regYear,
      regState,
      insuranceValidity,
      insuranceType,
      rcAvailability,
      engineCapacity,
      mileage,
      power,
      torque,
      topSpeed,
      drivetrain,
      accidentHistory,
      serviceHistory,
      noOfKeys,
      tyreCondition,
      batteryCondition,
      scratchDent,
      floodDamage,
      paintCondition,
      features,
      sellerType,
      sellerName,
      verifiedSeller,
      sellerPhone,
      sellerLocation,
      testDriveAvailable,
    } = req.body;

    if (
      !title ||
      !brand ||
      !model ||
      !color ||
      !year ||
      !price ||
      !fuelType ||
      !kmDriven ||
      !transmission ||
      !description ||
      !bodyType ||
      !seats ||
      !ownership
    ) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields" });
    }

    if (!BODY_TYPE_VALUES.includes(bodyType)) {
      return res.status(400).json({ error: "Invalid body type" });
    }
    if (!SEATS_VALUES.includes(seats)) {
      return res.status(400).json({ error: "Invalid seating capacity" });
    }
    if (!OWNERSHIP_VALUES.includes(ownership)) {
      return res.status(400).json({ error: "Invalid ownership" });
    }
    if (!color?.trim()) {
      return res.status(400).json({ error: "Invalid color" });
    }
    const normalizedColor = normalizeListingColor(color);

    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications =
          typeof req.body.specifications === "string"
            ? JSON.parse(req.body.specifications)
            : req.body.specifications;
      } catch (err) {
        console.error("Error parsing specifications:", err);
      }
    }
    specifications = enrichSpecifications(specifications, {
      bodyType,
      seats,
      ownership,
    });

    let parsedFeatures = {};
    if (features) {
      try {
        parsedFeatures =
          typeof features === "string" ? JSON.parse(features) : features;
      } catch (err) {
        console.error("Error parsing features on create:", err);
      }
    }

    const photos = req.files
      ? req.files.map((file) => `/uploads/vehicles/${file.filename}`)
      : [];

    if (req.user.role !== "customer" && req.files && req.files.length > 0) {
      let garageName = req.user.garageName;
      if (!garageName && ownerId) {
        const ownerDoc = await Owner.findById(ownerId);
        garageName = ownerDoc?.garageName || ownerDoc?.name || "Garage";
      } else if (!garageName) {
        garageName = "Garage";
      }

      for (const file of req.files) {
        const filePath = path.join("uploads/vehicles", file.filename);
        await addWatermark(filePath, garageName);
      }
    }

    const validStatus = ["Available", "Booked", "Sold", "Hidden"];
    const nextStatus = validStatus.includes(status) ? status : "Available";

    const newListing = await VehicleSale.create({
      ownerId,
      title,
      brand,
      model,
      color: normalizedColor,
      year: Number(year),
      price: Number(price),
      fuelType,
      kmDriven: Number(kmDriven),
      transmission,
      bodyType,
      seats,
      ownership,
      rtoCode: rtoCode ? String(rtoCode).trim() : undefined,
      rtoState: rtoState ? String(rtoState).trim() : undefined,
      description,
      specifications,
      photos,
      status: nextStatus,

      variant: variant ? String(variant).trim() : undefined,
      regYear: regYear ? Number(regYear) : undefined,
      regState: regState ? String(regState).trim() : undefined,
      insuranceValidity: insuranceValidity
        ? String(insuranceValidity).trim()
        : undefined,
      insuranceType: insuranceType ? String(insuranceType).trim() : undefined,
      rcAvailability: rcAvailability
        ? String(rcAvailability).trim()
        : undefined,
      engineCapacity: engineCapacity
        ? String(engineCapacity).trim()
        : undefined,
      mileage: mileage ? String(mileage).trim() : undefined,
      power: power ? String(power).trim() : undefined,
      torque: torque ? String(torque).trim() : undefined,
      topSpeed: topSpeed ? String(topSpeed).trim() : undefined,
      drivetrain: drivetrain ? String(drivetrain).trim() : undefined,
      accidentHistory: accidentHistory
        ? String(accidentHistory).trim()
        : undefined,
      serviceHistory: serviceHistory
        ? String(serviceHistory).trim()
        : undefined,
      noOfKeys: noOfKeys ? Number(noOfKeys) : undefined,
      tyreCondition: tyreCondition ? String(tyreCondition).trim() : undefined,
      batteryCondition: batteryCondition
        ? String(batteryCondition).trim()
        : undefined,
      scratchDent: scratchDent ? String(scratchDent).trim() : undefined,
      floodDamage: floodDamage ? String(floodDamage).trim() : undefined,
      paintCondition: paintCondition
        ? String(paintCondition).trim()
        : undefined,
      features: parsedFeatures,
      sellerType: sellerType ? String(sellerType).trim() : undefined,
      sellerName: sellerName ? String(sellerName).trim() : undefined,
      verifiedSeller: verifiedSeller === "true" || verifiedSeller === true,
      sellerPhone: sellerPhone ? String(sellerPhone).trim() : undefined,
      sellerLocation: sellerLocation
        ? String(sellerLocation).trim()
        : undefined,
      testDriveAvailable:
        testDriveAvailable === "true" || testDriveAvailable === true,
    });

    res.status(201).json({
      success: true,
      message: "Vehicle listed for sale successfully!",
      listing: newListing,
    });
  } catch (error) {
    console.error("CREATE VEHICLE LISTING ERROR:", error);
    res
      .status(500)
      .json({ error: "Failed to create vehicle listing: " + error.message });
  }
};

// 📋 GET OWNER LISTINGS (Owner Only)
export const getOwnerListings = async (req, res) => {
  try {
    if (!["admin", "owner"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only owners and admins can access their listings" });
    }

    const ownerId = req.user.effectiveOwnerId;
    if (!ownerId) {
      return res
        .status(400)
        .json({ error: "Active garage owner context required" });
    }

    const listings = await VehicleSale.find({ ownerId }).sort({
      createdAt: -1,
    });
    res.status(200).json(listings);
  } catch (error) {
    console.error("GET OWNER LISTINGS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch your listings" });
  }
};

// ✏️ UPDATE LISTING (Owner Only)
export const updateListing = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { id } = req.params;

    const listing = await VehicleSale.findById(id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (!["admin", "owner"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only owners and admins can update vehicle listings" });
    }

    if (listing.ownerId.toString() !== ownerId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this listing" });
    }

    const {
      title,
      brand,
      model,
      color,
      year,
      price,
      fuelType,
      kmDriven,
      transmission,
      description,
      status,
      existingPhotos,
      bodyType,
      seats,
      ownership,
      rtoCode,
      rtoState,
      variant,
      regYear,
      regState,
      insuranceValidity,
      insuranceType,
      rcAvailability,
      engineCapacity,
      mileage,
      power,
      torque,
      topSpeed,
      drivetrain,
      accidentHistory,
      serviceHistory,
      noOfKeys,
      tyreCondition,
      batteryCondition,
      scratchDent,
      floodDamage,
      paintCondition,
      features,
      sellerType,
      sellerName,
      verifiedSeller,
      sellerPhone,
      sellerLocation,
      testDriveAvailable,
    } = req.body;

    const nextBodyType = bodyType || listing.bodyType;
    const nextSeats = seats || listing.seats;
    const nextOwnership = ownership || listing.ownership;
    const nextColor = color ? normalizeListingColor(color) : listing.color;

    if (bodyType && !BODY_TYPE_VALUES.includes(bodyType)) {
      return res.status(400).json({ error: "Invalid body type" });
    }
    if (seats && !SEATS_VALUES.includes(seats)) {
      return res.status(400).json({ error: "Invalid seating capacity" });
    }
    if (ownership && !OWNERSHIP_VALUES.includes(ownership)) {
      return res.status(400).json({ error: "Invalid ownership" });
    }

    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications =
          typeof req.body.specifications === "string"
            ? JSON.parse(req.body.specifications)
            : req.body.specifications;
      } catch (err) {
        console.error("Error parsing specifications:", err);
      }
      specifications = enrichSpecifications(specifications, {
        bodyType: nextBodyType,
        seats: nextSeats,
        ownership: nextOwnership,
      });
    }

    let parsedFeatures = undefined;
    if (features !== undefined) {
      try {
        parsedFeatures =
          typeof features === "string" ? JSON.parse(features) : features;
      } catch (err) {
        console.error("Error parsing features in update:", err);
      }
    }

    let updatedPhotos = [];
    if (existingPhotos) {
      try {
        updatedPhotos =
          typeof existingPhotos === "string"
            ? JSON.parse(existingPhotos)
            : existingPhotos;
      } catch (err) {
        updatedPhotos = Array.isArray(existingPhotos)
          ? existingPhotos
          : [existingPhotos];
      }
    } else {
      updatedPhotos = listing.photos;
    }

    if (req.files && req.files.length > 0) {
      if (req.user.role !== "customer") {
        let garageName = req.user.garageName;
        if (!garageName && ownerId) {
          const ownerDoc = await Owner.findById(ownerId);
          garageName = ownerDoc?.garageName || ownerDoc?.name || "Garage";
        } else if (!garageName) {
          garageName = "Garage";
        }

        for (const file of req.files) {
          const filePath = path.join("uploads/vehicles", file.filename);
          await addWatermark(filePath, garageName);
        }
      }

      const newPhotos = req.files.map(
        (file) => `/uploads/vehicles/${file.filename}`,
      );
      updatedPhotos = [...updatedPhotos, ...newPhotos];
    }

    const validStatus = ["Available", "Booked", "Sold", "Hidden"];
    const nextStatus =
      status && validStatus.includes(status) ? status : listing.status;

    const updatedListing = await VehicleSale.findByIdAndUpdate(
      id,
      {
        title: title || listing.title,
        brand: brand || listing.brand,
        model: model || listing.model,
        color: nextColor,
        year: year ? Number(year) : listing.year,
        price: price ? Number(price) : listing.price,
        fuelType: fuelType || listing.fuelType,
        kmDriven: kmDriven ? Number(kmDriven) : listing.kmDriven,
        transmission: transmission || listing.transmission,
        bodyType: nextBodyType,
        seats: nextSeats,
        ownership: nextOwnership,
        rtoCode:
          rtoCode !== undefined
            ? rtoCode
              ? String(rtoCode).trim()
              : ""
            : listing.rtoCode,
        rtoState:
          rtoState !== undefined
            ? rtoState
              ? String(rtoState).trim()
              : ""
            : listing.rtoState,
        description: description || listing.description,
        specifications: req.body.specifications
          ? specifications
          : enrichSpecifications(listing.specifications, {
              bodyType: nextBodyType,
              seats: nextSeats,
              ownership: nextOwnership,
            }),
        photos: updatedPhotos,
        status: nextStatus,

        variant:
          variant !== undefined ? String(variant).trim() : listing.variant,
        regYear:
          regYear !== undefined
            ? regYear
              ? Number(regYear)
              : null
            : listing.regYear,
        regState:
          regState !== undefined ? String(regState).trim() : listing.regState,
        insuranceValidity:
          insuranceValidity !== undefined
            ? String(insuranceValidity).trim()
            : listing.insuranceValidity,
        insuranceType:
          insuranceType !== undefined
            ? String(insuranceType).trim()
            : listing.insuranceType,
        rcAvailability:
          rcAvailability !== undefined
            ? String(rcAvailability).trim()
            : listing.rcAvailability,
        engineCapacity:
          engineCapacity !== undefined
            ? String(engineCapacity).trim()
            : listing.engineCapacity,
        mileage:
          mileage !== undefined ? String(mileage).trim() : listing.mileage,
        power: power !== undefined ? String(power).trim() : listing.power,
        torque: torque !== undefined ? String(torque).trim() : listing.torque,
        topSpeed:
          topSpeed !== undefined ? String(topSpeed).trim() : listing.topSpeed,
        drivetrain:
          drivetrain !== undefined
            ? String(drivetrain).trim()
            : listing.drivetrain,
        accidentHistory:
          accidentHistory !== undefined
            ? String(accidentHistory).trim()
            : listing.accidentHistory,
        serviceHistory:
          serviceHistory !== undefined
            ? String(serviceHistory).trim()
            : listing.serviceHistory,
        noOfKeys:
          noOfKeys !== undefined
            ? noOfKeys
              ? Number(noOfKeys)
              : null
            : listing.noOfKeys,
        tyreCondition:
          tyreCondition !== undefined
            ? String(tyreCondition).trim()
            : listing.tyreCondition,
        batteryCondition:
          batteryCondition !== undefined
            ? String(batteryCondition).trim()
            : listing.batteryCondition,
        scratchDent:
          scratchDent !== undefined
            ? String(scratchDent).trim()
            : listing.scratchDent,
        floodDamage:
          floodDamage !== undefined
            ? String(floodDamage).trim()
            : listing.floodDamage,
        paintCondition:
          paintCondition !== undefined
            ? String(paintCondition).trim()
            : listing.paintCondition,
        features:
          parsedFeatures !== undefined ? parsedFeatures : listing.features,
        sellerType:
          sellerType !== undefined
            ? String(sellerType).trim()
            : listing.sellerType,
        sellerName:
          sellerName !== undefined
            ? String(sellerName).trim()
            : listing.sellerName,
        verifiedSeller:
          verifiedSeller !== undefined
            ? verifiedSeller === "true" || verifiedSeller === true
            : listing.verifiedSeller,
        sellerPhone:
          sellerPhone !== undefined
            ? String(sellerPhone).trim()
            : listing.sellerPhone,
        sellerLocation:
          sellerLocation !== undefined
            ? String(sellerLocation).trim()
            : listing.sellerLocation,
        testDriveAvailable:
          testDriveAvailable !== undefined
            ? testDriveAvailable === "true" || testDriveAvailable === true
            : listing.testDriveAvailable,
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Listing updated successfully!",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("UPDATE LISTING ERROR:", error);
    res
      .status(500)
      .json({ error: "Failed to update listing: " + error.message });
  }
};

// 🗑️ DELETE LISTING (Owner Only)
export const deleteListing = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const { id } = req.params;

    const listing = await VehicleSale.findById(id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (!["admin", "owner"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only owners and admins can delete vehicle listings" });
    }

    if (listing.ownerId.toString() !== ownerId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this listing" });
    }

    await VehicleSale.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully!",
    });
  } catch (error) {
    console.error("DELETE LISTING ERROR:", error);
    res.status(500).json({ error: "Failed to delete listing" });
  }
};

const buildColorFilter = (valuesCsv) => {
  if (!valuesCsv?.trim()) return null;

  const values = valuesCsv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!values.length) return null;

  const standardPattern = ["White", "Black", "Silver", "Grey", "Red", "Blue"]
    .map((c) => (c === "Grey" ? "Gr[ae]y" : escapeRegex(c)))
    .join("|");

  const orConditions = [];

  for (const val of values) {
    if (val === "Other") {
      orConditions.push({
        color: { $not: new RegExp(standardPattern, "i") },
      });
      continue;
    }
    const pattern = val === "Grey" ? "Gr[ae]y" : escapeRegex(val);
    const regex = new RegExp(pattern, "i");
    orConditions.push(
      { color: val },
      { color: regex },
      {
        specifications: {
          $elemMatch: { key: /color/i, value: regex },
        },
      },
      { specifications: { $elemMatch: { value: regex } } },
    );
  }

  return orConditions.length ? { $or: orConditions } : null;
};

const buildMarketplaceFacetFilter = (
  valuesCsv,
  { topLevelField, keyHint } = {},
) => {
  if (!valuesCsv?.trim()) return null;

  const parts = valuesCsv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const regexParts = parts.map((part) => {
    if (/^\d+\+$/.test(part)) {
      const num = part.slice(0, -1);
      const n = escapeRegex(num);
      return `${n}(\\+|\\s*\\+|\\s*(seater|seat|seats)\\b|\\b[89]\\d*\\b)`;
    }
    if (/^\d+$/.test(part)) {
      const n = escapeRegex(part);
      return `\\b${n}\\b(\\s*(seater|seat|seats)\\b)?`;
    }
    let escaped = escapeRegex(part);
    if (part.endsWith("+")) {
      escaped = `${escaped.replace(/\\\+$/, "")}(\\+)?`;
    }
    return escaped;
  });

  const combined = new RegExp(regexParts.join("|"), "i");

  const orConditions = [
    { title: combined },
    { description: combined },
    { model: combined },
    { specifications: { $elemMatch: { value: combined } } },
    { specifications: { $elemMatch: { key: combined } } },
  ];

  if (topLevelField) {
    orConditions.unshift({ [topLevelField]: combined });
  }

  if (keyHint) {
    orConditions.push({
      specifications: {
        $elemMatch: {
          key: keyHint,
          value: combined,
        },
      },
    });
  }

  return { $or: orConditions };
};

const buildStructuredFacetFilter = (valuesCsv, fieldName, keyHint) => {
  if (!valuesCsv?.trim()) return null;

  const values = valuesCsv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!values.length) return null;

  const fuzzy = buildMarketplaceFacetFilter(valuesCsv, { keyHint });
  return {
    $or: [{ [fieldName]: { $in: values } }, ...(fuzzy?.$or || [])],
  };
};

// 📋 GET MARKETPLACE LISTINGS (Customer/Public)
export const getMarketplaceListings = async (req, res) => {
  try {
    const {
      brand,
      model,
      transmission,
      fuelType,
      priceMin,
      priceMax,
      yearMin,
      yearMax,
      kmMin,
      kmMax,
      ownership,
      bodyType,
      seats,
      color,
      city,
      rtoCode,
      rtoState,
      search,
      ownerListed,
    } = req.query;

    const filter = {};

    if (brand)
      filter.brand = {
        $in: brand
          .split(",")
          .map((b) => new RegExp(escapeRegex(b.trim()), "i")),
      };
    if (model)
      filter.model = {
        $in: model
          .split(",")
          .map((m) => new RegExp(escapeRegex(m.trim()), "i")),
      };
    if (transmission) filter.transmission = { $in: transmission.split(",") };
    if (fuelType) filter.fuelType = { $in: fuelType.split(",") };

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    if (yearMin || yearMax) {
      filter.year = {};
      if (yearMin) filter.year.$gte = Number(yearMin);
      if (yearMax) filter.year.$lte = Number(yearMax);
    }
    if (kmMin || kmMax) {
      filter.kmDriven = {};
      if (kmMin) filter.kmDriven.$gte = Number(kmMin);
      if (kmMax) filter.kmDriven.$lte = Number(kmMax);
    }

    const andConditions = [];

    if (ownerListed === "true") {
      andConditions.push({
        $or: [{ customerId: { $exists: false } }, { customerId: null }],
      });
    }

    const ownershipFilter = buildStructuredFacetFilter(
      ownership,
      "ownership",
      /owner/i,
    );
    if (ownershipFilter) andConditions.push(ownershipFilter);

    const bodyTypeFilter = buildStructuredFacetFilter(
      bodyType,
      "bodyType",
      /body/i,
    );
    if (bodyTypeFilter) andConditions.push(bodyTypeFilter);

    const seatsFilter = buildStructuredFacetFilter(seats, "seats", /seat/i);
    if (seatsFilter) andConditions.push(seatsFilter);

    const colorFilter = buildColorFilter(color);
    if (colorFilter) andConditions.push(colorFilter);

    if (rtoCode) {
      const parts = rtoCode
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        const regexes = parts.map((p) => new RegExp(escapeRegex(p), "i"));
        andConditions.push({
          $or: [{ rtoCode: { $in: parts } }, { rtoCode: { $in: regexes } }],
        });
      }
    }

    if (rtoState) {
      const parts = rtoState
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        const regexes = parts.map((p) => new RegExp(escapeRegex(p), "i"));
        andConditions.push({
          $or: [
            { rtoState: { $in: parts } },
            { rtoState: { $in: regexes } },
            { specifications: { $elemMatch: { value: { $in: regexes } } } },
          ],
        });
      }
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      andConditions.push({
        $or: [
          { title: searchRegex },
          { brand: searchRegex },
          { model: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    filter.status = { $ne: "Hidden" };

    let listings = await VehicleSale.find(filter)
      .populate({
        path: "ownerId",
        select:
          "name garageName address mobileNumber logo city verificationStatus",
      })
      .populate({
        path: "customerId",
        select: "name email phone isVerified",
      });

    const statusOrder = { Available: 0, Booked: 1, Sold: 2, Hidden: 3 };
    listings = listings.sort((a, b) => {
      const rankA = statusOrder[a.status] ?? 4;
      const rankB = statusOrder[b.status] ?? 4;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (city) {
      const cityRegex = new RegExp(escapeRegex(city.trim()), "i");
      listings = listings.filter((item) => {
        let match = false;
        if (item.ownerId) {
          if (item.ownerId.city && cityRegex.test(item.ownerId.city))
            match = true;
          if (item.ownerId.address && cityRegex.test(item.ownerId.address))
            match = true;
        }
        return match;
      });
    }

    const customerId = resolvePortalCustomerId(req);
    const enriched = await enrichMarketplaceListings(listings, customerId);

    res.status(200).json(enriched);
  } catch (error) {
    console.error("GET MARKETPLACE LISTINGS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch marketplace listings" });
  }
};

// 📋 GET MARKETPLACE VEHICLE DETAILS (Customer/Public)
export const getMarketplaceVehicleDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await VehicleSale.findById(id)
      .populate({
        path: "ownerId",
        select:
          "name garageName address mobileNumber logo email verificationStatus",
      })
      .populate({
        path: "customerId",
        select: "name email phone isVerified",
      });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    let whatsappLink = "";

    if (vehicle.customerId && vehicle.customerId.phone) {
      let cleanedNumber = vehicle.customerId.phone.replace(/\D/g, "");

      if (cleanedNumber.length === 10) {
        cleanedNumber = "91" + cleanedNumber;
      }

      const messageText = `Hi ${vehicle.customerId.name || "there"}, I'm interested in your listed vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.year}) priced at ₹${vehicle.price.toLocaleString("en-IN")}. Is it still available?`;

      whatsappLink = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(messageText)}`;
    } else if (vehicle.ownerId && vehicle.ownerId.mobileNumber) {
      let cleanedNumber = vehicle.ownerId.mobileNumber.replace(/\D/g, "");

      if (cleanedNumber.length === 10) {
        cleanedNumber = "91" + cleanedNumber;
      }

      const messageText = `Hi ${vehicle.ownerId.name || "there"}, I'm interested in your listed vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.year}) priced at ₹${vehicle.price.toLocaleString("en-IN")}. Is it still available?`;

      whatsappLink = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(messageText)}`;
    }

    const customerId = resolvePortalCustomerId(req);
    const vehicleIds = [vehicle._id];

    const [wishlistedIds, wishlistCount, bookingRequest] = await Promise.all([
      customerId
        ? getWishlistedIdsForCustomer(customerId, vehicleIds)
        : Promise.resolve(new Set()),
      Wishlist.countDocuments({ vehicleSaleId: vehicle._id }),
      customerId
        ? Booking.findOne({ vehicleSaleId: vehicle._id, customerId })
            .sort({ requestedAt: -1 })
            .lean()
        : Promise.resolve(null),
    ]);

    const enrichedVehicle = enrichListingDoc(vehicle, {
      wishlistedIds,
      customerId,
    });

    const finalVehicle = {
      ...enrichedVehicle,
      wishlistCount,
      bookingRequest,
    };

    res.status(200).json({
      success: true,
      vehicle: finalVehicle,
      whatsappLink,
      isWishlisted: finalVehicle.isWishlisted,
    });
  } catch (error) {
    console.error("GET MARKETPLACE DETAILS ERROR:", error);

    res.status(500).json({
      error: "Failed to fetch vehicle details",
    });
  }
};

// 🔢 GET WISHLIST COUNT FOR A VEHICLE (Lightweight poll endpoint)
export const getMarketplaceWishlistCount = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Wishlist.countDocuments({ vehicleSaleId: id });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("GET WISHLIST COUNT ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch wishlist count" });
  }
};
