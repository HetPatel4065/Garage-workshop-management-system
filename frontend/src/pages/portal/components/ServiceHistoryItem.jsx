import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Calendar,
  Wrench,
  User,
  Package,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from "lucide-react";
import { FaCar } from "react-icons/fa";

const ServiceHistoryItem = ({ svc, isOpen, toggleExpand }) => {
  const hasParts = (svc.parts || []).length > 0;
  const hasLabor = (svc.laborCharges || []).length > 0;
  const hasSvcs = (svc.selectedServices || []).length > 0;

  // Safe service names string compiling parser
  const parsedServiceTitle = (
    Array.isArray(svc.serviceName)
      ? svc.serviceName
      : (svc.serviceName || "General Maintenance").split("\n").filter(Boolean)
  )
    .map((item) => ((typeof item === "object" ? item.name : item) || "").trim())
    .join(" - ");

  // Bulletproof String Interpolation for Vehicle Title (Prevents ReferenceErrors)
  const getVehicleTitle = () => {
    if (!svc.vehicle) return "";
    const segments = [];
    if (svc.vehicle.year) segments.push(svc.vehicle.year);
    if (svc.vehicle.make) segments.push(svc.vehicle.make);
    if (svc.vehicle.model) segments.push(svc.vehicle.model);
    return segments.join(" ");
  };

  return (
    <div className="border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors duration-300 w-full">
      {/* ── Summary Row ── */}
      <button
        type="button"
        onClick={() => toggleExpand(svc._id)}
        className="w-full flex items-start sm:items-center justify-between p-4 sm:px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-colors text-left gap-3 min-w-0"
      >
        {/* Left: Graphic Icon + Main Text Block */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg md:text-xl capitalize text-slate-900 dark:text-white line-clamp-2 pr-1 leading-snug">
              {parsedServiceTitle}
            </h3>

            {/* Metadata Badges Block - Clean wrap layout for ultra-small screens */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1.5">
              {svc.serviceId && (
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0">
                  {svc.serviceId}
                </span>
              )}
              {svc.licensePlate && (
                <span className="text-xs font-bold font-mono text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md shrink-0">
                  {svc.licensePlate}
                </span>
              )}
              {svc.jobCardId && (
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 shrink-0">
                  {svc.jobCardId}
                </span>
              )}

              {/* Status Badge (Inline view for Mobile viewports - Hidden on md+) */}
              <span
                className={`md:hidden px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                  svc.status === "Completed"
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                    : "bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                }`}
              >
                {svc.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions and Desktop Status Badge */}
        <div className="flex items-center gap-3 shrink-0 self-center">
          <div className="hidden md:block">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                svc.status === "Completed"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                  : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40"
              }`}
            >
              {svc.status}
            </span>
          </div>

          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`svc-detail-${svc._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-2 bg-slate-50/70 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 space-y-5">
              {/* Meta information parameters grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Service Date
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {svc.serviceDate
                      ? new Date(svc.serviceDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : new Date(svc.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                  </span>
                </div>

                {svc.nextServiceDate && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" /> Next Service
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {new Date(svc.nextServiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {svc.priority && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Priority
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 capitalize truncate">
                      {svc.priority}
                    </span>
                  </div>
                )}

                {svc.mechanicName && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-blue-500" /> Mechanic
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 capitalize truncate">
                      {svc.mechanicName}
                    </span>
                  </div>
                )}

                {svc.advisorName && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-500" /> Advisor
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 capitalize truncate">
                      {svc.advisorName}
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle parameters snapshot panel */}
              {svc.vehicle && (svc.vehicle.make || svc.vehicle.model) && (
                <div className="w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FaCar className="w-3 h-3 text-indigo-500" /> Vehicle
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-sm truncate">
                    {getVehicleTitle()}
                    {svc.vehicle.fuelType && (
                      <span className="ml-2 font-semibold text-slate-400 dark:text-zinc-500 lowercase first-letter:capitalize">
                        ({svc.vehicle.fuelType})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Services Done Flex System Layout */}
              {hasSvcs && (
                <div className="w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3 text-emerald-500" />{" "}
                    Services Done
                  </h4>
                  <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    {/* Header Row */}
                    <div className="flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                      <span className="w-2/3">Description</span>
                      <span className="w-1/3 text-right">Amount</span>
                    </div>
                    {/* Content Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {svc.selectedServices.map((sv, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors"
                        >
                          <span className="w-2/3 capitalize font-bold text-slate-700 dark:text-zinc-300 wrap-break-words pr-2">
                            {sv.name}
                          </span>
                          <span className="w-1/3 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                            ₹{Number(sv.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Parts Used Section ── */}
              {hasParts && (
                <div className="w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-amber-500" /> Parts Used
                  </h4>
                  <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    {/* DESKTOP/TABLET HEADER GRID (Hidden on mobile) */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                      <span className="col-span-6">Part</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Unit</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>

                    {/* DATA CONTAINER */}
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {svc.parts.map((p, i) => (
                        <div
                          key={i}
                          className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors"
                        >
                          {/*  MOBILE VIEW: Stacked List Layout (Visible on ultra-small screens) */}
                          <div className="block sm:hidden p-3 space-y-2">
                            <div className="font-bold text-slate-700 dark:text-zinc-300 text-xs capitalize wrap-break-words">
                              {p.name}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                              <div>
                                Qty:{" "}
                                <span className="text-slate-800 dark:text-zinc-200 font-bold">
                                  {p.quantity}
                                </span>
                                <span className="mx-1.5">×</span>₹
                                {Number(p.unitPrice || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                              <div className="text-xs font-black text-slate-900 dark:text-white">
                                Total: ₹
                                {Number(p.total || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>

                          {/* DESKTOP/TABLET VIEW: Clean Column Grid (Hidden on mobile) */}
                          <div className="hidden sm:grid grid-cols-12 gap-2 items-center px-4 py-2.5 text-xs sm:text-sm">
                            <span className="col-span-6 capitalize font-bold text-slate-700 dark:text-zinc-300 wrap-break-words pr-1">
                              {p.name}
                            </span>
                            <span className="col-span-2 font-bold text-slate-600 dark:text-zinc-400 text-center whitespace-nowrap">
                              {p.quantity}
                            </span>
                            <span className="col-span-2 font-semibold text-slate-600 dark:text-zinc-400 text-right whitespace-nowrap">
                              ₹
                              {Number(p.unitPrice || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="col-span-2 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                              ₹{Number(p.total || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Labor Charges Flex System Layout */}
              {hasLabor && (
                <div className="w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3 text-blue-500" /> Labor
                    Charges
                  </h4>
                  <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    {/* Header Row */}
                    <div className="flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                      <span className="w-2/3">Description</span>
                      <span className="w-1/3 text-right">Amount</span>
                    </div>
                    {/* Content Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {svc.laborCharges.map((l, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors"
                        >
                          <span className="w-2/3 capitalize font-bold text-slate-700 dark:text-zinc-300 wrap-break-words pr-2">
                            {l.description}
                          </span>
                          <span className="w-1/3 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                            ₹{Number(l.amount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks/Notes Box */}
              {svc.notes && (
                <div className="w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <StickyNote className="w-3 h-3 text-amber-500" /> Notes /
                    Remarks
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-350 font-medium bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl px-4 py-3 leading-relaxed shadow-sm wrap-break-words">
                    {svc.notes}
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

export default React.memo(ServiceHistoryItem);
