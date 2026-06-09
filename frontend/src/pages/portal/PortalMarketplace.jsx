import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Fuel,
  MapPin,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Tag,
  CircleEqual,
  Heart,
} from "lucide-react";
import { getStoredPreviewCustomerId } from "../../utils/portalPreview";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaCar } from "react-icons/fa";
import CardImageSlider from "../../components/marketplace/CardImageSlider";
import WishlistHeart from "../../components/marketplace/WishlistHeart";
import { useWishlist } from "../../context/WishlistContext";

const PortalMarketplace = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile width dynamically to adjust layout and animation targets
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Connect to socket for real-time booking status updates

  // Filters State
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [city, setCity] = useState("");

  const navigate = useNavigate();
  const token =
    sessionStorage.getItem("portal_token") ||
    sessionStorage.getItem("garage_token");
  const isPortalCustomer = !!sessionStorage.getItem("portal_token");
  const portalPreviewCustomerId = sessionStorage.getItem("portal_token")
    ? ""
    : getStoredPreviewCustomerId();

  // ── USE GLOBAL WISHLIST CONTEXT ──────────────────────────
  const { wishlistIds } = useWishlist();

  const handleWishlistChange = (vehicleId, isWishlisted) => {
    // Context handles the update automatically
    // This callback is for any additional local logic if needed
  };

  useEffect(() => {
    if (!token) {
      navigate("/portal");
      return;
    }
    fetchMarketplaceListings();
  }, [brand, transmission, fuelType, priceMax, yearMin, city]);

  // Debounced/triggered text search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMarketplaceListings();
  };

  const fetchMarketplaceListings = async (overrides = {}) => {
    setLoading(true);
    setError("");
    const active = {
      search: overrides.search ?? search,
      brand: overrides.brand ?? brand,
      transmission: overrides.transmission ?? transmission,
      fuelType: overrides.fuelType ?? fuelType,
      priceMax: overrides.priceMax ?? priceMax,
      yearMin: overrides.yearMin ?? yearMin,
      city: overrides.city ?? city,
    };
    try {
      const params = {
        ownerListed: "true",
      };
      if (active.search) params.search = active.search;
      if (active.brand) params.brand = active.brand;
      if (active.transmission) params.transmission = active.transmission;
      if (active.fuelType) params.fuelType = active.fuelType;
      if (active.priceMax) params.priceMax = active.priceMax;
      if (active.yearMin) params.yearMin = active.yearMin;
      if (active.city) params.city = active.city;

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/vehicle-sales/marketplace`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        },
      );
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load marketplace listings.");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setBrand("");
    setTransmission("");
    setFuelType("");
    setPriceMax("");
    setYearMin("");
    setCity("");
    fetchMarketplaceListings({
      search: "",
      brand: "",
      transmission: "",
      fuelType: "",
      priceMax: "",
      yearMin: "",
      city: "",
    });
  };

  // 🔍 FIXED: Listen for wishlist changes and update counts in the list
  useEffect(() => {
    let pending = null;
    const handler = (e) => {
      try {
        const { vehicleId, source, count } = e.detail || {};
        if (!vehicleId || typeof count !== "number") return;
        // Ignore optimistic updates; only update on confirmed changes
        if (source === "optimistic") return;

        // Update the vehicle count in the list
        setVehicles((prev) =>
          prev.map((v) =>
            v._id === vehicleId ? { ...v, wishlistCount: count } : v,
          ),
        );
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("wishlist:changed", handler);
    return () => {
      if (pending) clearTimeout(pending);
      window.removeEventListener("wishlist:changed", handler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faff] font-sans selection:bg-blue-100 selection:text-blue-600">
      {/* 🔮 Sticky Luxury Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4 shadow-lg backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-auto w-full sm:w-auto ${
                showFilters
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={resetFilters}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition-all cursor-auto"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 min-w-0">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* ── FILTERS SIDEBAR ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: isMobile ? "100%" : "300px", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="shrink-0 w-full lg:w-75 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs overflow-hidden h-fit"
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    Refine Search
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-auto lg:hidden"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Brand / Manufacturer
                    </label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 p-2.5 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors"
                    >
                      <option value="">All Brands</option>
                      <option value="Suzuki">Maruti And Suzuki</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="Tata">Tata</option>
                      <option value="Mahindra">Mahindra</option>
                      <option value="Honda">Honda</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Kia">Kia</option>
                      <option value="Ford">Ford</option>
                      <option value="BMW">BMW</option>
                      <option value="Mercedes">Mercedes</option>
                      <option value="Audi">Audi</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Transmission
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Manual", "Automatic"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setTransmission(transmission === type ? "" : type)
                          }
                          className={`py-2 px-3 text-xs font-black rounded-xl border transition-all cursor-auto ${
                            transmission === type
                              ? "bg-blue-50 border-blue-200 text-blue-600 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Fuel Type
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 p-2.5 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors"
                    >
                      <option value="">All Fuels</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Max Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 p-2.5 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Minimum Year */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Min Model Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2018"
                      value={yearMin}
                      onChange={(e) => setYearMin(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 p-2.5 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Owner City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmedabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 p-2.5 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={resetFilters}
                  className="w-full mt-6 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors cursor-auto text-center"
                >
                  Clear All Filters
                </button>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── VEHICLES MAIN SECTION ── */}
          <main className="flex-1 space-y-6">
            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, brand, model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all cursor-auto shrink-0"
              >
                Search
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold">
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xs animate-pulse"
                  >
                    <div className="aspect-video w-full bg-slate-200" />
                    <div className="p-5 space-y-4">
                      <div className="h-4 bg-slate-200 rounded-sm w-2/3" />
                      <div className="h-3 bg-slate-200 rounded-sm w-1/2" />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="h-6 bg-slate-200 rounded-md" />
                        <div className="h-6 bg-slate-200 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => {
                      // Only navigate if the click is NOT on the wishlist heart
                      if (e.target.closest("[data-wishlist-btn]")) return;
                      navigate(
                        `/portal/marketplace/pre-owned-cars/${vehicle._id}`,
                      );
                    }}
                    className="group flex flex-col bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xs hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-auto relative"
                  >
                    {/* Price tag over card */}
                    <div className="absolute top-3 left-3 rounded-xl bg-blue-600/90 text-white font-black text-xs px-3 py-1.5 shadow-md backdrop-blur-xs z-20 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />₹
                      {vehicle.price.toLocaleString("en-IN")}
                    </div>

                    {/* Wishlist heart button */}
                    <div
                      data-wishlist-btn
                      className="absolute top-3 right-3 z-20"
                    >
                      <WishlistHeart
                        vehicleId={vehicle._id}
                        wishlisted={wishlistedIds.has(vehicle._id)}
                        token={token}
                        portalPreviewCustomerId={portalPreviewCustomerId}
                        onChange={handleWishlistChange}
                        size="sm"
                      />
                    </div>

                    {/* Wishlist count badge */}
                    <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 text-white font-black text-[10px] px-2.5 py-1.5 shadow-md backdrop-blur-xs z-20 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" />
                      <span>{vehicle.wishlistCount || 0}</span>
                    </div>

                    {/* Image Slider */}
                    <CardImageSlider
                      photos={vehicle.photos}
                      title={vehicle.title}
                      variant="portal"
                    />

                    {/* Content */}
                    <div className="p-5 flex flex-1 flex-col">
                      <div className="mb-4">
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                          {vehicle.brand}
                        </span>
                        <h3 className="text-base font-black text-slate-800 mt-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {vehicle.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold line-clamp-2 mt-1">
                          {vehicle.description}
                        </p>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-2 gap-2 mt-auto text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{vehicle.year}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Fuel className="w-4 h-4 text-slate-400" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Wrench className="w-4 h-4 text-slate-400" />
                          <span>{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <CircleEqual className="w-4 h-4 text-slate-400" />
                          <span>{vehicle.kmDriven.toLocaleString()} KM</span>
                        </div>
                      </div>

                      {/* Seller Garage Badge */}
                      {vehicle.ownerId && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {vehicle.ownerId.logo ? (
                              <div className="w-8 h-8 rounded-lg border border-slate-200/60 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-2xs">
                                <img
                                  src={
                                    vehicle.ownerId.logo.startsWith("http")
                                      ? vehicle.ownerId.logo
                                      : `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, "")}/${vehicle.ownerId.logo.replace(/^\//, "")}`
                                  }
                                  alt={
                                    vehicle.ownerId.garageName || "Garage Logo"
                                  }
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.parentNode.innerHTML = `<div class="w-full h-full bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black">${vehicle.ownerId.garageName?.charAt(0) || "G"}</div>`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-black shadow-sm shrink-0">
                                {vehicle.ownerId.garageName?.charAt(0) || "G"}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-slate-700 truncate">
                                {vehicle.ownerId.garageName}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {vehicle.ownerId.city || "Local"}
                              </p>
                            </div>
                          </div>

                          <div className="h-7 w-7 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-450 border border-slate-100 transition-colors duration-300">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-xs">
                <FaCar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900">
                  No Vehicles Listed
                </h3>
                <p className="text-slate-500 font-bold text-sm max-w-md mx-auto mt-2">
                  We couldn't find any vehicles listed for sale that match your
                  search filters. Try clearing some criteria or checking back
                  later!
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition-all cursor-auto"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PortalMarketplace;
