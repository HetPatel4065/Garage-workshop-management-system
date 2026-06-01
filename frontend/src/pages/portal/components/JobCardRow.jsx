import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  User,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

const JobCardRow = ({ job, isOpen, toggleExpand }) => {
  const notes = job.notes || job.remarks || "";

  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors duration-300 w-full">
      {/* ── Summary Row (always visible) ── */}
      <button
        type="button"
        onClick={() => toggleExpand(job._id)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-colors text-left gap-3 min-w-0"
      >
        {/* Left Block Group */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate max-w-full">
              {job.jobCardId}
            </p>

            {/* Metadata Badge Row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <p className="text-[11px] sm:text-[13px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-2 py-0.5 rounded-lg w-fit shrink-0 font-mono tracking-wider">
                {job.licensePlate}
              </p>

              {/* Mobile Backup Date (Visible ONLY on small mobile screens) */}
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 sm:hidden flex items-center gap-1 shrink-0">
                {new Date(job.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year:"2-digit"
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Actions & Desktop Date */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Desktop Only Date */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Date
            </p>
            <p className="text-[13px] font-bold text-slate-600 dark:text-zinc-400">
              {new Date(job.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Action Caret Button */}
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-950">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            )}
          </div>
        </div>
      </button>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`job-detail-${job._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-2 bg-slate-50/70 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 space-y-5 sm:space-y-6">
              {/* Meta info row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <div className="flex flex-col gap-1 p-3 sm:p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm min-w-0">
                  <span className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />{" "}
                    Mechanic
                  </span>
                  <span className="text-sm capitalize font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {job.mechanicName || "Not Assigned"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 sm:p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm min-w-0">
                  <span className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />{" "}
                    Advisor
                  </span>
                  <span className="text-sm capitalize font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {job.advisorName || "Not Assigned"}
                  </span>
                </div>
              </div>

              {/* Job Instructions */}
              {(job.serviceInstructions || notes) && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />{" "}
                    Job Instructions
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-350 font-medium capitalize bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl px-4 sm:px-5 py-3.5 leading-relaxed shadow-sm wrap-break-words">
                    {job.serviceInstructions || notes}
                  </p>
                </div>
              )}

              {!job.mechanicName &&
                !job.advisorName &&
                !job.serviceInstructions &&
                !notes && (
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-zinc-500 font-bold text-center py-6">
                    No detailed instructions available for this job card.
                  </p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(JobCardRow);
