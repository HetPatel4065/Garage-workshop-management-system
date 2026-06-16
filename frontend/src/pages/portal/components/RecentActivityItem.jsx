import React from "react";
import { Wrench, CheckCircle2 } from "lucide-react";

const RecentActivityItem = ({ item, getStatusColor }) => {
  const isService = !!item.serviceId;
  const name = isService
    ? (Array.isArray(item.serviceName)
        ? item.serviceName
        : (item.serviceName || "General Maintenance")
            .split("\n")
            .filter(Boolean)
      )
        .map((i) => ((typeof i === "object" ? i.name : i) || "").trim())
        .join(" - ")
    : item.jobCardId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-blue-100 dark:hover:border-blue-900 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-300 w-full">
      {/* Left section containing Icon + Core details */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Icon block */}
        <div
          className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isService
              ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400"
              : "bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400"
          }`}
        >
          {isService ? (
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </div>

        {/* Text Area wrapper: min-w-0 tells flexbox it is allowed to shrink text */}
        <div className="min-w-0 flex-1">
          <p className="font-bold capitalize text-slate-900 dark:text-white col-span-full max-w-full sm:max-w-45 md:max-w-70 lg:max-w-80">
            {name}
          </p>

          {/* Metadata Sub-Row: flex-wrap keeps it secure on 320px screens */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0">
              {item.serviceId}
            </p>
            {item.serviceId && item.licensePlate && (
              <span className="w-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full shrink-0" />
            )}
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tight break-all">
              {item.licensePlate}
            </p>
          </div>
        </div>
      </div>

      {/* Right/Bottom Section: Badge and Date */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-zinc-800/40 shrink-0">
        <span
          className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${getStatusColor(
            item.status,
          )}`}
        >
          {item.status}
        </span>
        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 sm:mt-1">
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

export default RecentActivityItem;
