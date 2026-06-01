import React from "react";

function MetaField({ label, primary, secondary, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide sm:tracking-wider text-slate-600 border-b-2 border-slate-200 w-fit pb-0.5 mb-1 sm:mb-1.5 flex items-center gap-1">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold capitalize text-slate-800 leading-relaxed col-span-full">
        {primary || "—"}
      </p>
      {secondary && (
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 col-span-full">
          {secondary}
        </p>
      )}
    </div>
  );
}

export default function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
  onView,
  role,
}) {
  // Define status colors based on your requirements
  const statusStyles = {
    "WITH OWNER":
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
    "IN GARAGE":
      "bg-blue-100 dark:bg-blue-950/50 text-blue-700 border-blue-200",
    ARCHIVED:
      "bg-amber-100 dark:bg-amber-950/50 text-amber-700 border-amber-200",
  };

  const currentStatus = vehicle.status?.toUpperCase() || "ACTIVE";
  const statusColor =
    statusStyles[currentStatus] ||
    "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group h-full flex flex-col">
      {/* ── TOP ROW ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
        <h3 className="text-xl font-bold capitalize text-slate-900 tracking-tight">
          {vehicle.make} {vehicle.model}
        </h3>
        <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
          #{vehicle.vehicleId || vehicle._id?.slice(-6).toUpperCase() || "N/A"}
        </span>
        <span
          className={`px-2 py-0.5 border text-[10px] font-black tracking-widest rounded-lg uppercase ${statusColor}`}
        >
          {currentStatus}
        </span>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4 relative z-10">
        <MetaField
          label="License Plate"
          primary={vehicle.licensePlate || "N/A"}
        />
        <MetaField
          label="Owner Name"
          primary={
            vehicle.customerName || vehicle.customerId?.name || "Unknown"
          }
        />
        <MetaField label="Fuel Type" primary={vehicle.fuelType || "—"} />
        <MetaField
          label="Registered"
          primary={
            vehicle.createdAt
              ? new Date(vehicle.createdAt).toLocaleDateString("en-GB")
              : "—"
          }
        />
      </div>

      {/* ── SPACER ── */}
      <div className="mt-auto pt-6">
        <div className="border-t border-slate-100 mb-4" />
      </div>

      {/* ── BOTTOM ROW: Actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
        {/* View Details — Accessible to all */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(vehicle);
          }}
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vehicle);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vehicle._id || vehicle.id);
              }}
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
