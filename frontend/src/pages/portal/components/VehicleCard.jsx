import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Activity,
  Calendar,
  Clock,
  Gauge,
  Info,
  Hash,
} from "lucide-react";
import { FaCar } from "react-icons/fa";

const VehicleCard = ({ vehicle, isOpen, toggleExpand }) => {
  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors duration-300 w-full">
      {/* ── Summary Row (always visible) ── */}
      <button
        type="button"
        onClick={() => toggleExpand(vehicle._id)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-colors text-left gap-3 sm:gap-4 min-w-0"
      >
        {/* Left Side: Graphic + Text Block Group */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
          {/* Car Icon Box */}
          <div className="w-10 sm:w-14 h-10 sm:h-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-100 dark:shadow-none">
            <FaCar className="w-5 sm:w-7 h-5 sm:h-7 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Typography Engine */}
          <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1">
            {/* Row 1: Make & Model */}
            <div className="flex items-baseline gap-2 min-w-0">
              <h3 className="text-base sm:text-2xl font-bold capitalize tracking-tight text-black dark:text-white truncate max-w-37.5 sm:max-w-none">
                {vehicle.make} {vehicle.model}
              </h3>
            </div>

            {/* Row 2: Metadata Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* High-Contrast License Plate Style */}
              <div className="flex items-center bg-slate-600 dark:bg-zinc-800 rounded-md overflow-hidden shadow-sm border border-slate-800 dark:border-zinc-700 shrink-0">
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest font-mono">
                  {vehicle.licensePlate}
                </span>
              </div>

              {/* Year Badge */}
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 rounded-md border border-slate-200 dark:border-zinc-850 text-[10px] sm:text-[11px] font-bold shrink-0">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {vehicle.year}
              </span>

              {/* Status Badge */}
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-blue-100 dark:border-blue-900/40 shrink-0">
                {vehicle.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Chevron Action Trigger */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-950 transition-colors shrink-0">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-zinc-500" />
          )}
        </div>
      </button>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`vehicle-detail-${vehicle._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-2 bg-slate-50/50 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 space-y-6 sm:space-y-8">
              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-indigo-500" /> Fuel Type
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 capitalize">
                    {vehicle.fuelType || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings className="w-3 h-3 text-zinc-500" /> Transmission
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 capitalize">
                    {vehicle.transmission || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Gauge className="w-3 h-3 text-emerald-500" /> Mileage
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {vehicle.currentMileage?.toLocaleString() || "0"} KM
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-amber-500" /> Vehicle ID
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate max-w-full">
                    {vehicle.vehicleId || "N/A"}
                  </span>
                </div>
              </div>

              {/* Identity Details & Service Cards Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Panel 1: Identity Card */}
                <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <h4 className="text-[11px] sm:text-[12px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    Identity Information
                  </h4>
                  <div className="space-y-3">
                    {/* Replaced item-centered rows with responsive wrapping columns */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-50 dark:border-zinc-950/50 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
                        Chassis No
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-black dark:text-zinc-200 tracking-wide break-all sm:break-normal truncate sm:max-w-50 md:max-w-none">
                        {vehicle.chassisnumber || "Not Provided"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
                        Engine Type
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-black dark:text-zinc-200 capitalize truncate">
                        {vehicle.engineType || "Not Provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Service Schedule Card */}
                <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <h4 className="text-[11px] sm:text-[12px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Service Schedule
                  </h4>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-50 dark:border-zinc-950/50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
                          Last Service
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-200 pl-8 sm:pl-0">
                        {vehicle.serviceDate
                          ? new Date(vehicle.serviceDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "No record"}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                          <Calendar className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
                          Next Due
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 pl-8 sm:pl-0">
                        {vehicle.nextServiceDate
                          ? new Date(
                              vehicle.nextServiceDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Not scheduled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {vehicle.notes && (
                <div className="p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                  <h4 className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">
                    Vehicle Notes
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-350 font-medium leading-relaxed">
                    {vehicle.notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(VehicleCard);
