import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Loader2,
  Sparkles,
  Filter,
  Info,
  ShieldAlert,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "All",
  "General",
  "Periodic",
  "AC/Electrical",
  "Body Work",
  "Denting/Painting",
  "Other",
];

const CATEGORY_STYLES = {
  General:
    "bg-blue-50 text-blue-600 border-blue-150 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  Periodic:
    "bg-emerald-50 text-emerald-600 border-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  "AC/Electrical":
    "bg-amber-50 text-amber-600 border-amber-150 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  "Body Work":
    "bg-purple-50 text-purple-600 border-purple-150 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
  "Denting/Painting":
    "bg-rose-50 text-rose-600 border-rose-150 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
  Other:
    "bg-slate-50 text-slate-650 border-slate-150 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50",
};

// Generates dynamic short mock description for standard services if DB description is missing
const getMockDescription = (name, category) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes("oil"))
    return "Engine oil replacement with premium quality lubricants and filter change to ensure smooth running.";
  if (lowercaseName.includes("wash") || lowercaseName.includes("clean"))
    return "Complete exterior wash and deep interior cleaning to restore your car's showroom shine.";
  if (lowercaseName.includes("brake"))
    return "Detailed brake inspection, pad replacement, and fluid top-up for maximum road safety.";
  if (lowercaseName.includes("wheel") || lowercaseName.includes("alignment"))
    return "Precision 3D wheel alignment and balancing to improve tyre life and steering control.";
  if (lowercaseName.includes("ac") || lowercaseName.includes("air cond"))
    return "AC system pressure check, vent cleaning, gas top-up, and cabin filter replacement.";
  if (lowercaseName.includes("paint") || lowercaseName.includes("scratch"))
    return "High-grade scratch removal, dent repair, and paint matching using state-of-the-art ovens.";
  if (lowercaseName.includes("tune") || lowercaseName.includes("checkup"))
    return "Comprehensive multi-point vehicle diagnostics, battery check, and systems tune-up.";

  switch (category) {
    case "General":
      return "Quick inspection, fluid level check, and general health parameters assessment.";
    case "Periodic":
      return "Regular periodic maintenance package tailored to maintain optimal vehicle performance.";
    case "AC/Electrical":
      return "Electrical diagnostics, wiring verification, scanner test, and battery servicing.";
    case "Body Work":
      return "Structural repair, bumper alignment, panel replacement, and body component restoration.";
    case "Denting/Painting":
      return "Dent removal and premium painting with factory-grade color matching and clear coat finish.";
    default:
      return "Custom vehicle solution designed and executed by certified technicians at our workshop.";
  }
};

const PortalServicesCatalog = ({ token }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchServiceCatalog();
  }, []);

  const fetchServiceCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/service-catalog`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setServices(res.data);
    } catch (err) {
      console.error("Failed to fetch service catalog:", err);
      setError("Unable to load services catalog. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((svc) => {
    const matchesSearch =
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (svc.description &&
        svc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || svc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header and Description */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            Our Service Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-bold mt-1">
            Browse standard service packages and repair jobs available at our
            workshop.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search services by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-150 focus:border-blue-500 dark:focus:ring-blue-950 transition-all shadow-xs"
          />
        </div>

        {/* Category Pills (Horizontal Scroll on mobile) */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-auto whitespace-nowrap border shrink-0 ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin mb-4" />
          <p className="text-slate-550 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
            Loading Catalog Items...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/50 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-16 text-center">
          <Info className="w-12 h-12 text-slate-350 dark:text-zinc-650 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            No Services Found
          </h3>
          <p className="text-slate-500 dark:text-zinc-400 font-bold text-xs sm:text-sm max-w-md mx-auto mt-2">
            No matching services found in our catalog. Try adjusting your search
            keywords or choosing a different category.
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((svc) => (
              <motion.div
                layout
                key={svc._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col justify-between bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-blue-200 dark:hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    {/* Category */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        CATEGORY_STYLES[svc.category] || CATEGORY_STYLES.Other
                      }`}
                    >
                      {svc.category}
                    </span>

                    {/* Price */}
                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-black text-lg">
                      <IndianRupee className="w-4 h-4 shrink-0" />
                      <span>
                        {svc.defaultPrice?.toLocaleString("en-IN") || "0"}
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {svc.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-550 dark:text-zinc-400 font-bold mt-2.5 leading-relaxed line-clamp-3">
                    {svc.description ||
                      getMockDescription(svc.name, svc.category)}
                  </p>
                </div>

                <div className="border-t border-slate-50 dark:border-zinc-850 mt-6 pt-4 flex justify-between items-center text-[11px] font-bold text-slate-400">
                  <span>Standard Labor Charges Included</span>
                  <span className="text-blue-500 font-black">Get Estimate</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default PortalServicesCatalog;
