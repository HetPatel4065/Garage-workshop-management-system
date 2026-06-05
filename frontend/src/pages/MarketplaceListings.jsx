import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Tag,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Upload,
  Calendar,
  Layers,
  Settings,
  AlertTriangle,
  Info,
  IndianRupeeIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  CalendarCheck,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import VehicleFiltersSidebar from "./VehicleFiltersSidebar";
import CardImageSlider from "../components/marketplace/CardImageSlider";
import WishlistHeart from "../components/marketplace/WishlistHeart";
import EmptyState from "../components/UI/EmptyState";
import {
  BODY_TYPE_OPTIONS,
  SEATS_OPTIONS,
  OWNERSHIP_OPTIONS,
  COLOR_OPTIONS,
} from "../constants/vehicleMarketplaceOptions";
import { buildPortalAuthHeaders } from "../utils/portalPreview";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";

const normalizeListingStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (value === "sold") return "Sold";
  if (value === "booked") return "Booked";
  if (value === "hidden") return "Hidden";
  if (value === "available" || value === "active") return "Available";
  return "Available";
};

const ListingFilterTab = ({
  label,
  count,
  icon: Icon,
  active,
  onClick,
  colorClasses,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left w-full ${
      active
        ? `${colorClasses.activeBg} ${colorClasses.activeBorder} shadow-sm scale-[1.02]`
        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
    }`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? colorClasses.iconBg : "bg-slate-50"}`}
    >
      <Icon
        size={16}
        className={active ? colorClasses.iconColor : "text-slate-400"}
      />
    </div>
    <div className="min-w-0">
      <p
        className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${active ? colorClasses.label : "text-slate-400"}`}
      >
        {label}
      </p>
      <p
        className={`text-xl font-black leading-none ${active ? colorClasses.count : "text-slate-800"}`}
      >
        {count}
      </p>
    </div>
  </button>
);

const getBodyTypeFromListing = (listing) => {
  if (listing?.bodyType && BODY_TYPE_OPTIONS.includes(listing.bodyType)) {
    return listing.bodyType;
  }
  const spec = listing?.specifications?.find((s) =>
    /body\s*type/i.test(String(s.key || "")),
  );
  return spec?.value && BODY_TYPE_OPTIONS.includes(spec.value)
    ? spec.value
    : "";
};

const getSeatsFromListing = (listing) => {
  if (listing?.seats && SEATS_OPTIONS.includes(listing.seats)) {
    return listing.seats;
  }
  const spec = listing?.specifications?.find((s) =>
    /seating\s*capacity|^seats?$/i.test(String(s.key || "")),
  );
  return spec?.value && SEATS_OPTIONS.includes(spec.value) ? spec.value : "";
};

const getOwnershipFromListing = (listing) => {
  if (listing?.ownership && OWNERSHIP_OPTIONS.includes(listing.ownership)) {
    return listing.ownership;
  }
  const spec = listing?.specifications?.find((s) =>
    /ownership|owners?/i.test(String(s.key || "")),
  );
  return spec?.value && OWNERSHIP_OPTIONS.includes(spec.value)
    ? spec.value
    : "";
};

const getColorFromListing = (listing) => {
  const raw = String(listing?.color || "").trim();
  if (!raw) return "";
  if (COLOR_OPTIONS.includes(raw)) return raw;
  const matched = COLOR_OPTIONS.find(
    (c) => c !== "Other" && raw.toLowerCase().includes(c.toLowerCase()),
  );
  return matched || "Other";
};

export default function MarketplaceListings({
  token: customToken,
  isCustomer = false,
  currentUser = null,
  portalPreviewCustomerId = "",
}) {
  const { user, token: authToken } = useAuth();
  const token = customToken || authToken;
  const isManager = ["admin", "owner"].includes(user?.role?.toLowerCase());
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("listing");
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [kmDriven, setKmDriven] = useState("");
  const [transmission, setTransmission] = useState("Manual");
  const [bodyType, setBodyType] = useState("");
  const [seats, setSeats] = useState("5");
  const [ownership, setOwnership] = useState("");
  const [rtoCode, setRtoCode] = useState("");
  const [rtoState, setRtoState] = useState("");
  const [description, setDescription] = useState("");
  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [status, setStatus] = useState("Available");

  // New Details State
  const [variant, setVariant] = useState("");
  const [regYear, setRegYear] = useState("");
  const [regState, setRegState] = useState("");
  const [insuranceValidity, setInsuranceValidity] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [rcAvailability, setRcAvailability] = useState("Available");

  // Engine & Performance
  const [engineCapacity, setEngineCapacity] = useState("");
  const [mileage, setMileage] = useState("");
  const [power, setPower] = useState("");
  const [torque, setTorque] = useState("");
  const [topSpeed, setTopSpeed] = useState("");
  const [drivetrain, setDrivetrain] = useState("");

  // Condition
  const [accidentHistory, setAccidentHistory] = useState("No Accidents");
  const [serviceHistory, setServiceHistory] = useState("Yes");
  const [noOfKeys, setNoOfKeys] = useState("2");
  const [tyreCondition, setTyreCondition] = useState("Good");
  const [batteryCondition, setBatteryCondition] = useState("Good");
  const [scratchDent, setScratchDent] = useState("None");
  const [floodDamage, setFloodDamage] = useState("No");
  const [paintCondition, setPaintCondition] = useState("Original");

  // Features & Comfort Checkboxes
  const [features, setFeatures] = useState({
    sunroof: false,
    touchscreen: false,
    androidAuto: false,
    appleCarPlay: false,
    reverseCamera: false,
    parkingSensors: false,
    cruiseControl: false,
    automaticClimateControl: false,
    leatherSeats: false,
    alloyWheels: false,
    abs: false,
    airbags: false,
    pushStartButton: false,
  });

  // Seller Information
  const [sellerType, setSellerType] = useState("Garage");
  const [sellerName, setSellerName] = useState("");
  const [verifiedSeller, setVerifiedSeller] = useState(true);
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerLocation, setSellerLocation] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [testDriveAvailable, setTestDriveAvailable] = useState(true);
  const [ownerPanel, setOwnerPanel] = useState(
    searchParams.get("tab") || "listings",
  );
  const [submitting, setSubmitting] = useState(false);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [viewMode, setViewMode] = useState(
    isCustomer ? "explore" : "my-listings",
  );
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter State initialized from URL
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    brand: searchParams.get("brand") || undefined,
    model: searchParams.get("model") || undefined,
    priceMin: searchParams.get("priceMin") || undefined,
    priceMax: searchParams.get("priceMax") || undefined,
    yearMin: searchParams.get("yearMin") || undefined,
    yearMax: searchParams.get("yearMax") || undefined,
    kmMin: searchParams.get("kmMin") || undefined,
    kmMax: searchParams.get("kmMax") || undefined,
    fuelType: searchParams.get("fuelType") || undefined,
    transmission: searchParams.get("transmission") || undefined,
    ownership: searchParams.get("ownership") || undefined,
    bodyType: searchParams.get("bodyType") || undefined,
    seats: searchParams.get("seats") || undefined,
    color: searchParams.get("color") || undefined,
    city: searchParams.get("city") || undefined,
    rtoCode: searchParams.get("rtoCode") || undefined,
    rtoState: searchParams.get("rtoState") || undefined,
  });

  // Sync state to URL and fetch listings
  useEffect(() => {
    if (viewMode !== "explore") return;

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      setSearchParams(params, { replace: true });
      fetchListings();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, viewMode]);

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/vehicle-sales/${viewMode === "explore" ? "marketplace" : "my-listings"}`;

      if (viewMode === "explore") {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) query.append(key, value);
        });
        if (isCustomer) {
          query.append("ownerListed", "true");
        }
        const queryString = query.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const res = await fetch(url, {
        headers: buildPortalAuthHeaders(token, portalPreviewCustomerId),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load listings");
      setListings(Array.isArray(data) ? data : data?.listings || []);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "my-listings") {
      fetchListings();
    }
  }, [viewMode]);

  useEffect(() => {
    if (ownerPanel === "bookings") {
      fetchOwnerBookings();
    }
  }, [ownerPanel, token]);

  // Clear single filter chip
  const clearFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: undefined }));
  };

  // Form spec operations
  const addSpecField = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  // Remove spec field
  const removeSpecField = (index) => {
    setSpecifications(specifications.filter((_, idx) => idx !== index));
  };

  const handleSpecChange = (index, field, val) => {
    const updated = [...specifications];
    updated[index][field] = val;
    setSpecifications(updated);
  };

  // Image Upload Previews
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    setPhotoFiles([...photoFiles, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...previews]);
  };

  const removePhotoPreview = (index, isNew = true) => {
    if (isNew) {
      setPhotoFiles(photoFiles.filter((_, idx) => idx !== index));
      setPhotoPreviews(photoPreviews.filter((_, idx) => idx !== index));
    } else {
      setExistingPhotos(existingPhotos.filter((_, idx) => idx !== index));
    }
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingListing(null);
    setTitle("");
    setBrand("");
    setModel("");
    setColor("");
    setYear("");
    setPrice("");
    setFuelType("Petrol");
    setKmDriven("");
    setTransmission("Manual");
    setBodyType("Hatchback");
    setSeats("5");
    setOwnership("");
    setDescription("");
    setSpecifications([{ key: "", value: "" }]);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setStatus("Available");
    setRtoCode("");
    setRtoState("");

    // Reset new fields
    setVariant("");
    setRegYear("");
    setRegState("");
    setInsuranceValidity("");
    setInsuranceType("");
    setRcAvailability("Available");
    setEngineCapacity("");
    setMileage("");
    setPower("");
    setTorque("");
    setTopSpeed("");
    setDrivetrain("");
    setAccidentHistory("No Accidents");
    setServiceHistory("Yes");
    setNoOfKeys("2");
    setTyreCondition("Good");
    setBatteryCondition("Good");
    setScratchDent("None");
    setFloodDamage("No");
    setPaintCondition("Original");
    setFeatures({
      sunroof: false,
      touchscreen: false,
      androidAuto: false,
      appleCarPlay: false,
      reverseCamera: false,
      parkingSensors: false,
      cruiseControl: false,
      automaticClimateControl: false,
      leatherSeats: false,
      alloyWheels: false,
      abs: false,
      airbags: false,
      pushStartButton: false,
    });
    setSellerType("Garage");
    setSellerName("");
    setVerifiedSeller(true);
    setSellerPhone("");
    setSellerLocation("");
    setTestDriveAvailable(true);

    setModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (listing) => {
    setEditingListing(listing);
    setTitle(listing.title);
    setBrand(listing.brand);
    setModel(listing.model);
    setColor(getColorFromListing(listing));
    setYear(listing.regYear);
    setPrice(listing.price);
    setFuelType(listing.fuelType);
    setKmDriven(listing.kmDriven);
    setTransmission(listing.transmission);
    setBodyType(getBodyTypeFromListing(listing));
    setSeats(getSeatsFromListing(listing));
    setOwnership(getOwnershipFromListing(listing));
    setDescription(listing.description);
    const extraSpecs = (listing.specifications || []).filter(
      (s) =>
        !/^(body\s*type|seating\s*capacity|seats?|ownership|owners?)$/i.test(
          String(s.key || "").trim(),
        ),
    );
    setSpecifications(
      extraSpecs.length > 0 ? extraSpecs : [{ key: "", value: "" }],
    );
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos(listing.photos || []);
    setStatus(normalizeListingStatus(listing.status));
    setRtoCode(listing.rtoCode || "");
    setRtoState(listing.rtoState || "");

    // Load new fields
    setVariant(listing.variant || "");
    setRegYear(listing.regYear || "");
    setRegState(listing.regState || "");
    setInsuranceValidity(listing.insuranceValidity || "");
    setInsuranceType(listing.insuranceType || "");
    setRcAvailability(listing.rcAvailability || "Available");

    setEngineCapacity(listing.engineCapacity || "");
    setMileage(listing.mileage || "");
    setPower(listing.power || "");
    setTorque(listing.torque || "");
    setTopSpeed(listing.topSpeed || "");
    setDrivetrain(listing.drivetrain || "");

    setAccidentHistory(listing.accidentHistory || "No Accidents");
    setServiceHistory(listing.serviceHistory || "Yes");
    setNoOfKeys(listing.noOfKeys || "2");
    setTyreCondition(listing.tyreCondition || "Good");
    setBatteryCondition(listing.batteryCondition || "Good");
    setScratchDent(listing.scratchDent || "None");
    setFloodDamage(listing.floodDamage || "No");
    setPaintCondition(listing.paintCondition || "Original");

    setFeatures({
      sunroof: listing.features?.sunroof || false,
      touchscreen: listing.features?.touchscreen || false,
      androidAuto: listing.features?.androidAuto || false,
      appleCarPlay: listing.features?.appleCarPlay || false,
      reverseCamera: listing.features?.reverseCamera || false,
      parkingSensors: listing.features?.parkingSensors || false,
      cruiseControl: listing.features?.cruiseControl || false,
      automaticClimateControl:
        listing.features?.automaticClimateControl || false,
      leatherSeats: listing.features?.leatherSeats || false,
      alloyWheels: listing.features?.alloyWheels || false,
      abs: listing.features?.abs || false,
      airbags: listing.features?.airbags || false,
      pushStartButton: listing.features?.pushStartButton || false,
    });

    setSellerType(listing.sellerType || "Garage");
    setSellerName(listing.sellerName || "");
    setVerifiedSeller(
      listing.verifiedSeller !== undefined ? listing.verifiedSeller : true,
    );
    setSellerPhone(listing.sellerPhone || "");
    setSellerLocation(listing.sellerLocation || "");
    setTestDriveAvailable(
      listing.testDriveAvailable !== undefined
        ? listing.testDriveAvailable
        : true,
    );

    setModalOpen(true);
  };

  // Submit Listing Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bodyType || !seats || !ownership || !color) {
      addToast(
        "Please select body type, seating capacity, ownership, and color.",
        "error",
      );
      return;
    }

    // Validate specs
    const validSpecs = specifications.filter(
      (s) => s.key.trim() && s.value.trim(),
    );

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("brand", brand);
      formData.append("model", model);
      formData.append("color", color);
      formData.append("year", year);
      formData.append("price", price);
      formData.append("fuelType", fuelType);
      formData.append("kmDriven", kmDriven);
      formData.append("transmission", transmission);
      formData.append("bodyType", bodyType);
      formData.append("seats", seats);
      formData.append("ownership", ownership);
      formData.append("rtoCode", rtoCode);
      formData.append("rtoState", rtoState);
      formData.append("description", description);
      formData.append("specifications", JSON.stringify(validSpecs));
      formData.append("status", status);

      // Append new fields
      formData.append("variant", variant);
      formData.append("regYear", regYear);
      formData.append("regState", regState);
      formData.append("insuranceValidity", insuranceValidity);
      formData.append("insuranceType", insuranceType);
      formData.append("rcAvailability", rcAvailability);

      formData.append("engineCapacity", engineCapacity);
      formData.append("mileage", mileage);
      formData.append("power", power);
      formData.append("torque", torque);
      formData.append("topSpeed", topSpeed);
      formData.append("drivetrain", drivetrain);

      formData.append("accidentHistory", accidentHistory);
      formData.append("serviceHistory", serviceHistory);
      formData.append("noOfKeys", noOfKeys);
      formData.append("tyreCondition", tyreCondition);
      formData.append("batteryCondition", batteryCondition);
      formData.append("scratchDent", scratchDent);
      formData.append("floodDamage", floodDamage);
      formData.append("paintCondition", paintCondition);

      formData.append("features", JSON.stringify(features));

      formData.append("sellerType", sellerType);
      formData.append("sellerName", sellerName);
      formData.append("verifiedSeller", verifiedSeller);
      formData.append("sellerPhone", sellerPhone);
      formData.append("sellerLocation", sellerLocation);
      formData.append("testDriveAvailable", testDriveAvailable);

      if (editingListing) {
        formData.append("existingPhotos", JSON.stringify(existingPhotos));
      }

      for (let i = 0; i < photoFiles.length; i++) {
        formData.append("photos", photoFiles[i]);
      }

      const url = editingListing
        ? `${import.meta.env.VITE_API_URL}/vehicle-sales/${editingListing._id}`
        : `${import.meta.env.VITE_API_URL}/vehicle-sales`;

      const method = editingListing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save listing failed");

      addToast(
        editingListing
          ? "Vehicle listing updated successfully!"
          : "Vehicle listed for sale successfully!",
        "success",
      );
      setModalOpen(false);
      fetchListings();
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (listing, nextStatus) => {
    if (normalizeListingStatus(listing.status) === nextStatus) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/vehicle-sales/${listing._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update status failed");

      addToast(`Listing status updated to ${nextStatus}`, "success");
      fetchListings();
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  // Toggle status directly for quick available / sold action
  const handleToggleStatus = async (listing) => {
    const newStatus =
      normalizeListingStatus(listing.status) === "Available"
        ? "Sold"
        : "Available";
    await handleUpdateStatus(listing, newStatus);
  };

  // Delete Listing
  const handleDeleteListing = async (id) => {
    try {
      setDeleting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/vehicle-sales/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete listing failed");

      addToast("Listing deleted successfully", "delete");
      fetchListings();
      if (ownerPanel === "bookings") {
        fetchOwnerBookings();
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (id) => {
    try {
      setDeleting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete booking failed");

      addToast("Booking deleted", "delete");
      fetchOwnerBookings();
      fetchListings();
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteType === "listing") {
      await handleDeleteListing(deleteTarget);
    } else {
      await handleDeleteBooking(deleteTarget);
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const fetchOwnerBookings = async () => {
    if (!isManager) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/owner`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      setOwnerBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingDecision = async (bookingId, action) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/decision`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update booking");

      addToast(
        `Booking ${action === "accept" ? "accepted" : "rejected"}`,
        "success",
      );
      fetchOwnerBookings();
      fetchListings();
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  // Stats and Filtering
  const currentUserId = currentUser?._id || currentUser?.id;
  const myListingsOnly = isCustomer
    ? listings.filter((l) => l.customerId === currentUserId)
    : listings;

  const totalListings = myListingsOnly.length;
  const activeListings = myListingsOnly.filter((l) => {
    const status = normalizeListingStatus(l.status);
    return status === "Available" || status === "Booked";
  }).length;
  const soldListings = myListingsOnly.filter(
    (l) => normalizeListingStatus(l.status) === "Sold",
  ).length;
  const estimatedRevenue = myListingsOnly
    .filter((l) => normalizeListingStatus(l.status) === "Sold")
    .reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  const listingFilterTabs = [
    {
      label: "All Listings",
      value: "All",
      count: totalListings,
      icon: Tag,
      colorClasses: {
        activeBg: "bg-blue-50",
        activeBorder: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        label: "text-blue-600",
        count: "text-blue-700",
      },
    },
    {
      label: "Active",
      value: "Active",
      count: activeListings,
      icon: CheckCircle,
      colorClasses: {
        activeBg: "bg-emerald-50",
        activeBorder: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        label: "text-emerald-600",
        count: "text-emerald-700",
      },
    },
    {
      label: "Sold",
      value: "Sold",
      count: soldListings,
      icon: Layers,
      colorClasses: {
        activeBg: "bg-violet-50",
        activeBorder: "border-violet-200",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        label: "text-violet-600",
        count: "text-violet-700",
      },
    },
  ];

  const matchesStatusFilter = (listing) => {
    const status = normalizeListingStatus(listing.status);
    if (statusFilter === "All") return true;
    if (statusFilter === "Active")
      return status === "Available" || status === "Booked";
    if (statusFilter === "Sold") return status === "Sold";
    return true;
  };

  const filteredListings = (
    viewMode === "my-listings" ? myListingsOnly : listings
  )
    .filter((listing) => {
      if (viewMode !== "my-listings") return true;
      return matchesStatusFilter(listing);
    })
    .filter((listing) => {
      if (!isCustomer || !showWishlistOnly) return true;
      return listing.isWishlisted;
    });

  const bookingsBody = bookingsLoading ? (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-4 text-slate-500 dark:text-zinc-400 font-medium">
        Loading booking requests...
      </p>
    </div>
  ) : ownerBookings.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl border border-dashed bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800">
      <CalendarCheck className="w-16 h-16 text-slate-300 dark:text-zinc-700 mb-4" />
      <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-200">
        No booking requests yet
      </h3>
      <p className="text-slate-500 dark:text-zinc-400 mt-2 max-w-md">
        Customers will see available listings on the marketplace and submit
        booking or test drive requests from the vehicle detail page.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {ownerBookings.map((booking) => {
        const vehicle = booking.vehicleSaleId || {};
        const status = booking.status || "pending";
        const requestType = booking.requestType || "booking";
        return (
          <div
            key={booking._id}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {vehicle.title || "Untitled Vehicle"}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {vehicle.brand} • {vehicle.model} • {vehicle.regYear}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Customer: {booking.customerId?.name || "Unknown"} •{" "}
                  {booking.customerId?.phone ||
                    booking.customerId?.email ||
                    "Contact info missing"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                  {requestType === "test-drive" ? "Test Drive" : "Booking"}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                  {normalizeListingStatus(vehicle.status)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1 ${status === "accepted" ? "bg-emerald-500 text-white" : status === "rejected" ? "bg-red-500 text-white" : "bg-amber-500 text-zinc-950"}`}
                >
                  {status}
                </span>
              </div>
            </div>
            {booking.note && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Message: {booking.note}
              </p>
            )}

            {/* Action Button Container */}
            <div className="mt-4 flex flex-wrap gap-3">
              {status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleBookingDecision(booking._id, "accept")}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBookingDecision(booking._id, "reject")}
                    className="px-4 py-2 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}

              {/* Delete Button - Styled to match your theme */}
              <button
                type="button"
                onClick={() => {
                  setDeleteType("booking");
                  setDeleteTarget(booking._id);
                  setDeleteModalOpen(true);
                }}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-bold transition"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleWishlistCardChange = (vehicleId, wishlisted) => {
    setListings((prev) =>
      prev.map((item) =>
        item._id === vehicleId ? { ...item, isWishlisted: wishlisted } : item,
      ),
    );
  };

  const emptyListingsMessage =
    viewMode === "explore"
      ? "Try adjusting your filters or expanding your search criteria to find what you're looking for."
      : statusFilter === "Active"
        ? "You have no active listings right now. List a vehicle or re-list a sold one."
        : statusFilter === "Sold"
          ? "No sold vehicles yet. Mark a listing as sold when the sale is complete."
          : "You haven't listed any vehicles yet. Click the button above to add your first listing.";

  const listingsBody = loading ? (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-4 text-slate-500 dark:text-zinc-400 font-medium">
        Loading listings...
      </p>
    </div>
  ) : filteredListings.length === 0 ? (
    <EmptyState
      icon={Tag}
      title="No vehicles found"
      description={emptyListingsMessage}
      primaryAction={
        viewMode === "my-listings" && isManager
          ? { label: "List New Car", onClick: handleOpenAdd }
          : undefined
      }
      secondaryAction={
        viewMode === "explore"
          ? {
              label: "Clear all filters",
              onClick: () => {
                setFilters({ search: "" });
                setSearchParams(new URLSearchParams(), { replace: true });
              },
            }
          : undefined
      }
      className={
        viewMode === "my-listings"
          ? "bg-white border-slate-200"
          : "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800"
      }
    />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {filteredListings.map((item) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target.closest("[data-wishlist-btn]")) return;
            if (isCustomer) {
              navigate(`/portal/marketplace/${item._id}`);
            }
          }}
          className={`bg-white dark:bg-zinc-900 rounded-md border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col shadow-xs group hover:border-emerald-300 dark:hover:border-zinc-700 transition-all duration-300 ${
            isCustomer ? "cursor-auto hover:shadow-lg active:scale-[0.99]" : ""
          }`}
        >
          <div className="h-48 w-full bg-slate-100 dark:bg-zinc-800 relative overflow-hidden">
            <CardImageSlider photos={item.photos} title={item.title} />
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
              {(() => {
                const status = normalizeListingStatus(item.status);
                if (status === "Sold") {
                  return (
                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      Sold
                    </span>
                  );
                }
                if (status === "Booked") {
                  return (
                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md bg-amber-500 text-zinc-950">
                      Booked
                    </span>
                  );
                }
                if (status === "Hidden") {
                  return (
                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md bg-slate-700 text-slate-100">
                      Hidden
                    </span>
                  );
                }
                return (
                  <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md bg-emerald-500 text-white">
                    Available
                  </span>
                );
              })()}
            </div>
            {isCustomer && token && (
              <div className="absolute top-4 right-4 z-20" data-wishlist-btn>
                <WishlistHeart
                  vehicleId={item._id}
                  wishlisted={!!item.isWishlisted}
                  token={token}
                  portalPreviewCustomerId={portalPreviewCustomerId}
                  onChange={handleWishlistCardChange}
                  size="sm"
                  alwaysVisible
                />
              </div>
            )}
            <span className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-emerald-400 rounded-xl shadow-md border border-zinc-800 z-20">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10.5px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {item.brand}
                </span>
                <span>{item.regYear}</span>
              </div>
              <h3 className="font-extrabold text-lg capitalize text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug line-clamp-1">
                {item.title}
              </h3>
              <p className="text-sm font-bold capitalize text-slate-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              {(item.rtoCode || item.regState || item.rtoState) && (
                <div className="mt-2">
                  <span className="inline-block text-[11px] uppercase font-bold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/30 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800">
                    {item.rtoCode ? item.rtoCode : ""}
                    {item.rtoCode && (item.regState || item.rtoState)
                      ? " • "
                      : ""}
                    {item.regState || item.rtoState || ""}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col bg-slate-50/50 dark:bg-zinc-950/20 p-2 rounded-xl border border-slate-100/50 dark:border-zinc-900/40">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                    KM Driven
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 mt-0.5">
                    {item.kmDriven.toLocaleString("en-IN")} km
                  </span>
                </div>
                <div className="flex flex-col bg-slate-50/50 dark:bg-zinc-950/20 p-2 rounded-xl border border-slate-100/50 dark:border-zinc-900/40">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                    Transmission
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 mt-0.5">
                    {item.transmission}
                  </span>
                </div>
                <div className="flex flex-col bg-slate-50/50 dark:bg-zinc-950/20 p-2 rounded-xl border border-slate-100/50 dark:border-zinc-900/40">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                    Fuel Type
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 mt-0.5">
                    {item.fuelType}
                  </span>
                </div>
                <div className="flex flex-col bg-slate-50/50 dark:bg-zinc-950/20 p-2 rounded-xl border border-slate-100/50 dark:border-zinc-900/40">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                    Model
                  </span>
                  <span className="text-xs font-bold capitalize text-slate-700 dark:text-zinc-350 mt-0.5">
                    {item.model}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking button logic for customers */}
            {isCustomer && (
              <div
                onClick={(e) => e.stopPropagation()} // Prevents parent card clicks from firing on the spacing
                className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0 flex items-center justify-between gap-3"
              >
                {/* Always Visible: View Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigate(`/portal/marketplace/${item._id}`);
                  }}
                  className="w-full px-4 py-3 bg-slate-300 hover:bg-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 rounded-xl text-sm font-bold transition-all border border-transparent flex items-center justify-center gap-2 cursor-auto shadow-sm active:scale-[0.98]"
                >
                  <span>View Details</span>
                  {/* Inline Arrow SVG (→) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5l6 6m0 0l-6 6m6-6H3"
                    />
                  </svg>
                </button>
              </div>
            )}
            {!isCustomer && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/60 shrink-0">
                {/* Status Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(item);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    normalizeListingStatus(item.status) === "Available"
                      ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                      : "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:border-emerald-600 dark:hover:bg-emerald-500"
                  }`}
                >
                  {normalizeListingStatus(item.status) === "Available" ? (
                    <>
                      <CheckCircle size={14} />
                      <span>Mark Sold</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Re-List Auto</span>
                    </>
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(item);
                  }}
                  className="p-2 rounded-xl border transition-all active:scale-90 flex items-center justify-center shrink-0 cursor-pointer 
                bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 
                dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600"
                  title="Edit vehicle listing Details"
                >
                  <Edit2 size={14} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteType("listing");
                    setDeleteTarget(item._id);
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 rounded-xl border transition-all active:scale-90 flex items-center justify-center shrink-0 cursor-pointer 
                bg-slate-50 text-slate-400 border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 
                dark:bg-zinc-800/40 dark:text-zinc-500 dark:border-zinc-800 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600"
                  title="Remove from Tab"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const pageBody = ownerPanel === "bookings" ? bookingsBody : listingsBody;

  return (
    <>
      {viewMode === "my-listings" ? (
        <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950">
          {" "}
          <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
                  Car Sales
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                  Sell Cars
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-3">
                  Manage vehicle listings.
                </p>
              </div>

              {isManager && ownerPanel === "listings" && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl h-10.5 self-start sm:self-auto"
                >
                  <Plus size={17} />
                  List New Car
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setOwnerPanel("listings");
                  setSearchParams({}, { replace: true });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  ownerPanel === "listings"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                My Listings
              </button>
              <button
                type="button"
                onClick={() => {
                  setOwnerPanel("bookings");
                  setSearchParams({ tab: "bookings" }, { replace: true });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  ownerPanel === "bookings"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <CalendarCheck size={14} />
                Bookings
              </button>
            </div>
          </div>
          <>
            <>
              {/* Combined Layout Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:col-span-3">
                  {listingFilterTabs.map((tab) => (
                    <ListingFilterTab
                      key={tab.value}
                      label={tab.label}
                      count={tab.count}
                      icon={tab.icon}
                      colorClasses={tab.colorClasses}
                      active={statusFilter === tab.value}
                      onClick={() => setStatusFilter(tab.value)}
                    />
                  ))}
                </div>

                {/* Sold Revenue Card - Takes up the 4th column slot on desktop */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm h-full w-full">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                    <IndianRupeeIcon
                      size={16}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 leading-none mb-1">
                      Sold Revenue
                    </p>
                    <p className="text-xl font-black text-slate-800 dark:text-white leading-none">
                      ₹ {estimatedRevenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Content Body */}
              {pageBody}
            </>
          </>
        </div>
      ) : (
        <div className="flex flex-col h-full min-w-0 lg:flex-row">
          <VehicleFiltersSidebar
            filters={filters}
            setFilters={setFilters}
            isMobile={isMobile}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isCustomer={isCustomer}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mt-3 pl-2">
                    Explore Pre-Owned Cars
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 pl-2">
                    Find the perfect pre-owned vehicle for you.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-auto"
                    >
                      <Filter className="w-4 h-4" /> Filters
                    </button>
                  )}
                  {isCustomer && token && (
                    <button
                      onClick={() => setShowWishlistOnly((prev) => !prev)}
                      className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-auto border ${
                        showWishlistOnly
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 shadow-sm"
                          : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-rose-300 hover:text-rose-500 dark:hover:border-rose-700"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${showWishlistOnly ? "fill-rose-500 text-rose-500" : "text-slate-400 dark:text-zinc-500"}`}
                      />
                      <span>Wishlist</span>
                      {(() => {
                        const count = listings.filter(
                          (l) => l.isWishlisted,
                        ).length;
                        return count > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black transition-all ${
                              showWishlistOnly
                                ? "bg-rose-500 text-white"
                                : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                            }`}
                          >
                            {count}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-justify min-h-7.5 mt-2.5">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || key === "search") return null;

                  let label = value;
                  if (key === "priceMin") label = `Min ₹${value}`;
                  if (key === "priceMax") label = `Max ₹${value}`;
                  if (key === "yearMin") label = `From ${value}`;
                  if (key === "yearMax") label = `To ${value}`;
                  if (key === "kmMin") label = `Min ${value} km`;
                  if (key === "kmMax") label = `Max ${value} km`;

                  if (value.includes(",")) {
                    label = `${key}: ${value.split(",").length} selected`;
                  }

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800/50"
                    >
                      <span>{label}</span>
                      <button
                        onClick={() => clearFilter(key)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors cursor-auto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-zinc-950/50 min-h-0">
              {pageBody}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Form for Add/Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingListing(null);
        }}
        title={editingListing ? "Edit Car Listing" : "List New Car for Sale"}
        subtitle="Fill in details and upload high-res photos to present this car on the customer marketplace"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Basic Car Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              1. Basic Car Details
            </h4>

            {/* Title & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Advertisement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pristine Condition Hyundai i20 Sportz"
                  className="w-full h-11 capitalize px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm font-semibold transition-all text-slate-955 dark:text-white"
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Sold">Sold</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* Brand, Model, Variant, Year, Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Hyundai"
                  className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. i20"
                  className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Variant
                </label>
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="e.g. Asta (O) 1.2"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Mfg Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2021"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 650000"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Reg Year, Reg State, RTO Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Registration Year
                </label>
                <input
                  type="number"
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  placeholder="e.g. 2021"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Registration State
                </label>
                <input
                  type="text"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  placeholder="e.g. Gujarat, Maharashtra"
                  className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  RTO Code
                </label>
                <input
                  type="text"
                  value={rtoCode}
                  onChange={(e) => setRtoCode(e.target.value)}
                  placeholder="e.g. GJ01, MH12"
                  className="w-full h-11 px-4 uppercase rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Body Type, Seating, Ownership */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Body Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm font-semibold transition-all text-slate-950 dark:text-white"
                >
                  <option value="">Select body type</option>
                  {BODY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Seating Capacity <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm font-semibold transition-all text-slate-950 dark:text-white"
                >
                  <option value="">Select seating capacity</option>
                  {SEATS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Ownership <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm font-semibold transition-all text-slate-955 dark:text-white"
                >
                  <option value="">Select ownership</option>
                  {OWNERSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fuel, Transmission, KM, Color */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Transmission <span className="text-red-500">*</span>
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  KM Driven <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={kmDriven}
                  onChange={(e) => setKmDriven(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Color <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm font-semibold transition-all text-slate-950 dark:text-white"
                >
                  <option value="">Select color</option>
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Private/Admin details: Insurance Validity, Insurance Type, RC Availability */}
            <div className="bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800 space-y-3.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Administrative & RTO Verification (Private/Admin Only)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                    Insurance Validity
                  </label>
                  <input
                    type="text"
                    value={insuranceValidity}
                    onChange={(e) => setInsuranceValidity(e.target.value)}
                    placeholder="e.g. Dec 2027 or Comprehensive"
                    className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus:outline-none text-sm transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                    Insurance Type
                  </label>
                  <input
                    type="text"
                    value={insuranceType}
                    onChange={(e) => setInsuranceType(e.target.value)}
                    placeholder="e.g. Comprehensive, Zero Dep"
                    className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus:outline-none text-sm transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                    RC Availability
                  </label>
                  <select
                    value={rcAvailability}
                    onChange={(e) => setRcAvailability(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                    <option value="In Process">In Process</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Engine & Performance */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              2. Engine & Performance
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Engine Capacity (cc)
                </label>
                <input
                  type="text"
                  value={engineCapacity}
                  onChange={(e) => setEngineCapacity(e.target.value)}
                  placeholder="e.g. 1197 cc"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Mileage (km/l)
                </label>
                <input
                  type="text"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 18.5 km/l"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Drivetrain
                </label>
                <select
                  value={drivetrain}
                  onChange={(e) => setDrivetrain(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="">Select drivetrain</option>
                  <option value="FWD">FWD – Front Wheel Drive</option>
                  <option value="RWD">RWD – Rear Wheel Drive</option>
                  <option value="AWD">AWD – All Wheel Drive</option>
                  <option value="4WD">4WD – Four Wheel Drive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Power
                </label>
                <input
                  type="text"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  placeholder="e.g. 81.86 bhp"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Torque
                </label>
                <input
                  type="text"
                  value={torque}
                  onChange={(e) => setTorque(e.target.value)}
                  placeholder="e.g. 113.75 Nm"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Top Speed (optional)
                </label>
                <input
                  type="text"
                  value={topSpeed}
                  onChange={(e) => setTopSpeed(e.target.value)}
                  placeholder="e.g. 165 km/h"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Condition Details */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              3. Condition Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Accident History
                </label>
                <select
                  value={accidentHistory}
                  onChange={(e) => setAccidentHistory(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="No Accidents">No Accidents</option>
                  <option value="Minor Scratches Only">
                    Minor Scratches Only
                  </option>
                  <option value="Repaired Accident Damage">
                    Repaired Accident Damage
                  </option>
                  <option value="Accident History Exists">
                    Accident History Exists
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Service History
                </label>
                <select
                  value={serviceHistory}
                  onChange={(e) => setServiceHistory(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="Yes">Yes (Full Service History)</option>
                  <option value="Partial">Partial History</option>
                  <option value="No">No History</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Number of Keys
                </label>
                <input
                  type="number"
                  value={noOfKeys}
                  onChange={(e) => setNoOfKeys(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Tyre Condition
                </label>
                <select
                  value={tyreCondition}
                  onChange={(e) => setTyreCondition(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="New">New (100%)</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Replacement">Needs Replacement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Battery Condition
                </label>
                <select
                  value={batteryCondition}
                  onChange={(e) => setBatteryCondition(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Replacement">Needs Replacement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Scratch/Dent Status
                </label>
                <select
                  value={scratchDent}
                  onChange={(e) => setScratchDent(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="None">None</option>
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Flood Damage Check
                </label>
                <select
                  value={floodDamage}
                  onChange={(e) => setFloodDamage(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="No">No Damage</option>
                  <option value="Yes">Yes (Flood Affected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Paint Condition
                </label>
                <select
                  value={paintCondition}
                  onChange={(e) => setPaintCondition(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm font-semibold transition-all text-slate-900 dark:text-white"
                >
                  <option value="Original">Original Paint</option>
                  <option value="Minor Scratches">Minor Scratches</option>
                  <option value="Repainted Panels">Repainted Panels</option>
                  <option value="Fully Repainted">Fully Repainted</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Features & Comfort Checkbox Grid */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              4. Features & Comfort
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80">
              {[
                { key: "sunroof", label: "Sunroof" },
                { key: "touchscreen", label: "Touchscreen Display" },
                { key: "androidAuto", label: "Android Auto" },
                { key: "appleCarPlay", label: "Apple CarPlay" },
                { key: "reverseCamera", label: "Reverse Camera" },
                { key: "parkingSensors", label: "Parking Sensors" },
                { key: "cruiseControl", label: "Cruise Control" },
                {
                  key: "automaticClimateControl",
                  label: "Automatic Climate Control",
                },
                { key: "leatherSeats", label: "Leather Seats" },
                { key: "alloyWheels", label: "Alloy Wheels" },
                { key: "abs", label: "ABS" },
                { key: "airbags", label: "Airbags" },
                { key: "pushStartButton", label: "Push Start Button" },
              ].map((feat) => (
                <label
                  key={feat.key}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-auto text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs"
                >
                  <input
                    type="checkbox"
                    checked={features[feat.key] || false}
                    onChange={(e) =>
                      setFeatures({
                        ...features,
                        [feat.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded border-slate-250 dark:border-zinc-800 shrink-0"
                  />
                  <span className="truncate">{feat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECTION 5: Seller Information */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              5. Seller Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Seller Type
                </label>
                <div className="flex items-center w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-800/20 text-sm font-semibold text-slate-500 dark:text-zinc-400 cursor-not-allowed">
                  Garage (Workshop)
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={sellerPhone}
                  onChange={(e) => {
                    let input = e.target.value;
                    if (
                      !input ||
                      input === "+" ||
                      input === "+9" ||
                      input === "+91" ||
                      input === "+91 "
                    ) {
                      setSellerPhone(input);
                      return;
                    }
                    const digits = input.replace(/\D/g, "");
                    let phoneBody = digits;
                    if (digits.startsWith("91")) {
                      phoneBody = digits.substring(2);
                    }
                    phoneBody = phoneBody.substring(0, 10);
                    setSellerPhone(`+91 ${phoneBody}`);
                  }}
                  onBlur={() => {
                    if (
                      sellerPhone.trim() === "+91" ||
                      sellerPhone === "+" ||
                      sellerPhone === "+9"
                    ) {
                      setSellerPhone("");
                    }
                  }}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  Location / City
                </label>
                <input
                  type="text"
                  value={sellerLocation}
                  onChange={(e) => setSellerLocation(e.target.value)}
                  placeholder="e.g. Ahmedabad, Mumbai"
                  className="w-full h-11 px-4 capitalize rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4.5 pt-7.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-auto select-none">
                  <input
                    type="checkbox"
                    checked={verifiedSeller}
                    onChange={(e) => setVerifiedSeller(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded border-slate-250 dark:border-zinc-800"
                  />
                  <span>Verified Seller Badge</span>
                </label>
              </div>

              <div className="flex items-center gap-4.5 pt-7.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-auto select-none">
                  <input
                    type="checkbox"
                    checked={testDriveAvailable}
                    onChange={(e) => setTestDriveAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded border-slate-250 dark:border-zinc-800"
                  />
                  <span>Available for Test Drive</span>
                </label>
              </div>
            </div>
          </div>

          {/* 4. Short Description & Photo Gallery Section Title */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-black dark:bg-white rounded-sm" />
              Additional Information & Media
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a premium short pitch highlighting engine status, maintenance records, and interior condition..."
                rows={3}
                className="w-full capitalize p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 focus:outline-none text-sm transition-all resize-none dark:text-white"
              />
            </div>
          </div>

          {/* 5. Photos Upload & Gallery */}
          <div className="border-t border-slate-200 pt-3">
            <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">
              Vehicle Photo Gallery
            </label>
            <p className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-2">
              Note: Only photo size less then 5 MB is Valid
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Add Photo Button */}
              <label className="w-24 h-24 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/20 hover:bg-emerald-500/10 hover:border-emerald-400 cursor-auto flex flex-col items-center justify-center gap-1.5 transition-colors group shrink-0">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">
                  Upload
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>

              {/* Previews (Existing Photos) */}
              {existingPhotos.map((photo, idx) => (
                <div
                  key={`exist-${idx}`}
                  className="w-24 h-24 rounded-2xl bg-zinc-800 border border-zinc-800 overflow-hidden relative group"
                >
                  <img
                    src={
                      photo?.startsWith("http")
                        ? photo
                        : `${import.meta.env.VITE_BASE_URL}${photo}`
                    }
                    alt="existing-preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhotoPreview(idx, false)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Previews (New Photos) */}
              {photoPreviews.map((previewUrl, idx) => (
                <div
                  key={`new-${idx}`}
                  className="w-24 h-24 rounded-2xl bg-zinc-800 border border-zinc-800 overflow-hidden relative group"
                >
                  <img
                    src={previewUrl}
                    alt="new-preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhotoPreview(idx, true)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Operations */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 disabled:opacity-65 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Listing...</span>
                </>
              ) : (
                <span>Save Vehicle Listing</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={deleteType === "listing" ? "Delete Listing" : "Delete Booking"}
        message={
          deleteType === "listing"
            ? "Are you sure you want to delete this vehicle advertisement listing permanently?"
            : "Are you sure you want to delete this booking?"
        }
        confirmText="Yes, Delete"
        type="delete"
        isLoading={deleting}
      />
    </>
  );
}
