import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
} from "lucide-react";

import {
  BODY_TYPE_OPTIONS,
  SEATS_OPTIONS,
  OWNERSHIP_OPTIONS,
  COLOR_OPTIONS,
  TRANSMISSION_OPTIONS, // add this
} from "../constants/vehicleMarketplaceOptions";

// Filter Options
const filterOptions = {
  fuelType: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"],
  transmission: [
    ...TRANSMISSION_OPTIONS.Manual,
    ...TRANSMISSION_OPTIONS.Automatic,
  ],
  ownership: OWNERSHIP_OPTIONS,
  bodyType: BODY_TYPE_OPTIONS,
  seats: SEATS_OPTIONS,
  color: COLOR_OPTIONS,
};

// Common Indian car brands for dropdown
const brandModels = {
  Maruti: [
    "Swift",
    "Baleno",
    "Wagon R",
    "Alto K10",
    "Dzire",
    "Brezza",
    "Ertiga",
    "Fronx",
    "Grand Vitara",
    "Celerio",
    "S-Presso",
    "Ignis",
    "Ciaz",
    "XL6",
    "Jimny",
    "Invicto",
    "Eeco",
    "e Vitara", // First All-Electric SUV launch
  ],
  Hyundai: [
    "i20",
    "i20 N Line",
    "Creta",
    "Creta N Line",
    "Venue",
    "Venue N Line",
    "Grand i10 Nios",
    "Verna",
    "Aura",
    "Tucson",
    "Exter",
    "Alcazar",
    "Ioniq 5", // Premium EV
  ],
  Tata: [
    "Nexon",
    "Nexon EV",
    "Punch",
    "Punch EV",
    "Tiago",
    "Tiago EV",
    "Altroz",
    "Harrier",
    "Safari",
    "Tigor",
    "Tigor EV",
    "Curvv", // SUV-Coupe offering
    "Curvv EV",
  ],
  Mahindra: [
    "Thar",
    "Thar ROXX", // 5-Door variant
    "XUV700", // Often badged as XUV 7XO line transitions
    "Scorpio-N",
    "Scorpio Classic",
    "Bolero",
    "Bolero Neo",
    "XUV 3XO", // The updated XUV300 facelift
    "XUV400 EV",
    "XEV 9e", // New flagship electric lineup
    "BE 6",
  ],
  Kia: ["Seltos", "Sonet", "Carens", "EV6", "EV9"],
  Toyota: [
    "Fortuner",
    "Innova Crysta",
    "Innova Hycross",
    "Glanza",
    "Urban Cruiser Hyryder",
    "Taisor", // Baleno/Fronx-based crossover offering
    "Hilux",
    "Camry",
    "Vellfire",
  ],
  Honda: ["City", "City Hybrid (e:HEV)", "Amaze", "Elevate"],
  Volkswagen: [
    "Virtus",
    "Taigun",
    "Tiguan",
    "ID.4", // EV additions
  ],
  Skoda: [
    "Slavia",
    "Kushaq",
    "Kodiaq",
    "Kylaq", // Sub-4m compact SUV addition
  ],
  MG: [
    "Hector",
    "Hector Plus",
    "Astor",
    "Comet EV",
    "ZS EV",
    "Gloster",
    "Windsor EV", // Crossover EV offering
  ],
};

// Accordion modified to look like an independent card block matching Cardekho layout mechanics
const AccordionCard = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all duration-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors group cursor-auto"
      >
        <span className="font-bold text-sm text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-slate-100 dark:border-zinc-800/50"
          >
            <div className="p-4 bg-white dark:bg-zinc-900">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function VehicleFiltersSidebar({
  filters,
  setFilters,
  onClose,
  isMobile,
  isOpen = true,
  isCustomer,
}) {
  // Accordion states
  const [openSections, setOpenSections] = useState({
    budget: true,
    brand: true,
    year: false,
    fuel: false,
    transmission: false,
    kmDriven: false,
    ownership: false,
    bodyType: false,
    seats: false,
    color: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckbox = (key, value) => {
    setFilters((prev) => {
      const current = prev[key] ? prev[key].split(",") : [];
      if (current.includes(value)) {
        const updated = current.filter((item) => item !== value).join(",");
        return { ...prev, [key]: updated || undefined };
      } else {
        return { ...prev, [key]: [...current, value].join(",") };
      }
    });
  };

  const handleBrandChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      brand: e.target.value || undefined,
      model: undefined,
    }));
  };

  const clearAll = () => {
    setFilters({ search: filters.search });
  };

  const CheckboxList = ({ filterKey, options }) => {
    const activeValues = filters[filterKey]
      ? filters[filterKey].split(",")
      : [];

    return (
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-3 cursor-auto group"
          >
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${activeValues.includes(opt) ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500" : "border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950/20 group-hover:border-blue-400 dark:group-hover:border-blue-500"}`}
            >
              {activeValues.includes(opt) && (
                <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
              )}
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors">
              {opt}
            </span>
            <input
              type="checkbox"
              className="hidden"
              checked={activeValues.includes(opt)}
              onChange={() => handleCheckbox(filterKey, opt)}
            />
          </label>
        ))}
      </div>
    );
  };

  const content = (
    <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 overflow-hidden">
      {/* Sidebar Top Bar Sticky Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="font-black text-base text-slate-950 dark:text-white">
            Filters
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="text-xs font-bold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors cursor-auto"
          >
            Clear All
          </button>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors cursor-auto"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Stack of Individual Cards - Changed container background to match cards seamlessly */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-zinc-950/30">
        {/* Location Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5 block">
            Location
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search City..."
              value={filters.city || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  city: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <input
              type="text"
              placeholder="RTO Code (e.g. GJ01)"
              value={filters.rtoCode || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  rtoCode: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
            <input
              type="text"
              placeholder="State (e.g. Gujarat)"
              value={filters.regState || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  regState: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
          </div>
        </div>

        {/* Budget Card */}
        <AccordionCard
          title="Budget"
          isOpen={openSections.budget}
          onToggle={() => toggleSection("budget")}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.priceMin || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceMin: e.target.value || undefined,
                  }))
                }
                className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
              />
            </div>
            <span className="text-slate-400 dark:text-zinc-600">-</span>
            <div className="flex-1 min-w-0">
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.priceMax || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceMax: e.target.value || undefined,
                  }))
                }
                className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
              />
            </div>
          </div>
        </AccordionCard>

        {/* Brand & Model Card */}
        <AccordionCard
          title="Brand & Model"
          isOpen={openSections.brand}
          onToggle={() => toggleSection("brand")}
        >
          <div className="space-y-3">
            <div className="relative">
              <select
                value={filters.brand || ""}
                onChange={handleBrandChange}
                className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900/25 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all appearance-none cursor-auto"
              >
                <option value="">All Brands</option>
                {Object.keys(brandModels).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-zinc-500 pointer-events-none" />
            </div>

            {filters.brand && brandModels[filters.brand] && (
              <div className="relative">
                <select
                  value={filters.model || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      model: e.target.value || undefined,
                    }))
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900/25 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all appearance-none cursor-auto"
                >
                  <option value="">All Models</option>
                  {brandModels[filters.brand].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-zinc-500 pointer-events-none" />
              </div>
            )}
          </div>
        </AccordionCard>

        {/* Year Card */}
        <AccordionCard
          title="Model Year"
          isOpen={openSections.year}
          onToggle={() => toggleSection("year")}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="From"
              value={filters.yearMin || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  yearMin: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
            <span className="text-slate-400 dark:text-zinc-600">-</span>
            <input
              type="number"
              placeholder="To"
              value={filters.yearMax || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  yearMax: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
          </div>
        </AccordionCard>

        {/* KM Driven Card */}
        <AccordionCard
          title="Kilometers Driven"
          isOpen={openSections.kmDriven}
          onToggle={() => toggleSection("kmDriven")}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min KM"
              value={filters.kmMin || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  kmMin: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
            <span className="text-slate-400 dark:text-zinc-600">-</span>
            <input
              type="number"
              placeholder="Max KM"
              value={filters.kmMax || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  kmMax: e.target.value || undefined,
                }))
              }
              className="w-full bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-950/10 transition-all"
            />
          </div>
        </AccordionCard>

        {/* Fuel Type Card */}
        <AccordionCard
          title="Fuel Type"
          isOpen={openSections.fuel}
          onToggle={() => toggleSection("fuel")}
        >
          <CheckboxList filterKey="fuelType" options={filterOptions.fuelType} />
        </AccordionCard>

        {/* Transmission Card */}
        <AccordionCard
          title="Transmission"
          isOpen={openSections.transmission}
          onToggle={() => toggleSection("transmission")}
        >
          <CheckboxList
            filterKey="transmission"
            options={filterOptions.transmission}
          />
        </AccordionCard>

        {/* Ownership Card */}
        <AccordionCard
          title="Ownership"
          isOpen={openSections.ownership}
          onToggle={() => toggleSection("ownership")}
        >
          <CheckboxList
            filterKey="ownership"
            options={filterOptions.ownership}
          />
        </AccordionCard>

        {/* Body Type Card */}
        <AccordionCard
          title="Body Type"
          isOpen={openSections.bodyType}
          onToggle={() => toggleSection("bodyType")}
        >
          <CheckboxList filterKey="bodyType" options={filterOptions.bodyType} />
        </AccordionCard>

        {/* Seats Card */}
        <AccordionCard
          title="Seats"
          isOpen={openSections.seats}
          onToggle={() => toggleSection("seats")}
        >
          <CheckboxList filterKey="seats" options={filterOptions.seats} />
        </AccordionCard>

        {/* Color Card */}
        <AccordionCard
          title="Color"
          isOpen={openSections.color}
          onToggle={() => toggleSection("color")}
        >
          <CheckboxList filterKey="color" options={filterOptions.color} />
        </AccordionCard>
      </div>
    </div>
  );

  // MOBILE VIEW - Drawer layer
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm m-0 p-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="h-full w-[85%] max-w-[320px] shadow-2xl overflow-hidden m-0 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="hidden lg:block w-72 shrink-0 border-r border-slate-200 dark:border-zinc-800">
      <div className="sticky top-0 h-screen bg-white dark:bg-zinc-900">
        <div className="h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
          {content}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 999px;
          }

          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
          }

          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `,
        }}
      />
    </div>
  );
}
