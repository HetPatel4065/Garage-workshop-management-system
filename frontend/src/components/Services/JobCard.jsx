import React from "react";
import { User, Wrench } from "lucide-react";

function MetaField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide sm:tracking-wider text-slate-600 border-b-2 border-slate-200 w-fit mb-1 sm:mb-1.5 pb-0.5">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug capitalize col-span-full">
        {value || "—"}
      </p>
    </div>
  );
}

export default function JobCard({
  jc,
  v = {},
  ownerName,
  onEdit,
  onDelete,
  onView,
  role,
  userId,
  formatDate,
}) {
  const displayDate = formatDate
    ? formatDate(v.serviceDate || jc.createdAt)
    : v.serviceDate || jc.createdAt
      ? new Date(v.serviceDate || jc.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const displayNextDate = formatDate
    ? formatDate(v.nextServiceDate)
    : v.nextServiceDate
      ? new Date(v.nextServiceDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const isAssignedToMe =
    (jc.mechanicId?._id || jc.mechanicId) === userId ||
    (jc.advisorId?._id || jc.advisorId) === userId;

  const canEdit = role === "owner" || role === "admin";

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group cursor-auto">
      {/* ── TOP ROW: Name + ID + Status ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {v.make} {v.model || "Vehicle"}
        </h3>
        <span className="px-2 py-0.5  bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
          #{jc.jobCardId || jc._id?.slice(-6).toUpperCase()}
        </span>
        {jc.advisorId?.name && (
          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-900/500 text-[10.5px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-indigo-300">
            <User size={10} className="shrink-0" />
            <span className="max-w-full">Advisor: {jc.advisorId.name}</span>
          </span>
        )}
        {jc.mechanicId?.name && (
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[10.5px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-slate-400">
            <Wrench size={10} className="shrink-0" />
            <span className="max-w-full">Mechanic: {jc.mechanicId.name}</span>
          </span>
        )}
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-6.5 mb-4">
        <MetaField label="Customer" value={ownerName} />
        <MetaField label="Plate Number" value={v.licensePlate || "NO PLATE"} />
        <MetaField label="Service Date" value={displayDate} />
        <MetaField label="Next Service" value={displayNextDate} />
        <MetaField
          label="Instructions"
          value={jc.serviceInstructions || "General Maintenance"}
        />
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
        {/* View Details — Accessible to all */}
        <button
          onClick={() => onView(jc)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition active:scale-95"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Details
        </button>

        {/* Edit + Delete — Restricted Roles */}
        {role !== "mechanic" && role !== "advisor" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(jc)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 rounded-xl transition active:scale-95 shadow-sm"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            <button
              onClick={() => onDelete(jc._id)}
              className="inline-flex items-center justify-center p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition active:scale-90"
              title="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
