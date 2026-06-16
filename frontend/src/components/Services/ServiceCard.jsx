import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import PartsUsedList from "./PartsUsedList";
import {
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Wrench,
} from "lucide-react";

function MetaField({ label, primary, secondary, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide sm:tracking-wider text-slate-600 border-b-2 border-slate-200 w-fit pb-0.5 mb-1 sm:mb-1.5 flex items-center gap-1">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">
        {primary || "—"}
      </p>
      {secondary && (
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 truncate">
          {secondary}
        </p>
      )}
    </div>
  );
}

export default function ServiceCard({
  service,
  onEdit,
  onDelete,
  onView,
  onGenerate,
  user,
  formatDate,
  isAssignedMechanic,
}) {
  const role = user?.role || "mechanic";
  const userId = user?._id;

  const isAssignedToMe =
    (service.mechanicId?._id || service.mechanicId) === userId ||
    (service.advisorId?._id || service.advisorId) === userId;

  const canEdit = role === "owner" || role === "admin" || isAssignedToMe;

  const [notesOpen, setNotesOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);

  const partsCount = service.partsUsed?.length ?? 0;
  const partsTotal = service.partsUsed?.reduce(
    (sum, p) => sum + (p.price ?? 0) * (p.qty ?? 1),
    0,
  );

  const displayDate =
    service.vehicleId?.serviceDate || service.serviceDate || service.createdAt
      ? new Date(
          service.vehicleId?.serviceDate ||
            service.serviceDate ||
            service.createdAt,
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const displayNextDate =
    service.vehicleId?.nextServiceDate || service.nextServiceDate
      ? new Date(
          service.vehicleId?.nextServiceDate || service.nextServiceDate,
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="bg-white rounded-3xl p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group cursor-auto">
      {/* ── TOP ROW: name + ID + status ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
        <h3 className="text-xl font-bold capitalize text-slate-900 tracking-tight">
          {(() => {
            const tickedTasks = (service?.requestedServices || [])
              .filter((r) => r.status === "Done")
              .map((r) => r.description || "Task");

            if (tickedTasks.length === 0) {
              return <span>{service.serviceName || "General Service"}</span>;
            }

            return tickedTasks.map((t, i) => (
              <span key={i}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {i < tickedTasks.length - 1 && (
                  <span className="mx-2 text-gray-300 font-extrabold">+</span>
                )}
              </span>
            ));
          })()}
        </h3>
        <span className="px-2 py-0.5  bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
          #{service.serviceId || service._id?.slice(-6)?.toUpperCase() || "N/A"}
        </span>
        <StatusBadge status={service.status} />
        {service.advisorId?.name && (
          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-900/500 text-[10.5px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-indigo-300">
            <User size={12} />
            <span className=" max-w-fit">
              Advisor: {service.advisorId.name}
            </span>
          </span>
        )}
        {service.mechanicId?.name && (
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[10.5px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-slate-400">
            <Wrench size={12} className="" />
            <span className=" max-w-fit">
              Mechanic: {service.mechanicId.name}
            </span>
          </span>
        )}
        {service.serviceType && (
          <span className="px-2 py-0.5 border border-blue-100 bg-blue-50 text-blue-700 text-[10px] font-black tracking-widest rounded-lg uppercase">
            {service.serviceType}
          </span>
        )}
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 relative z-10">
        <MetaField
          label="Customer"
          primary={service.customerId?.name || "Unknown"}
        />
        <MetaField
          label="Vehicle"
          primary={
            `${service.vehicle?.make ?? ""} ${service.vehicle?.model ?? ""}`.trim() ||
            "—"
          }
          secondary={service.vehicle?.licensePlate}
        />
        <MetaField label="Service Date" primary={displayDate} />
        <MetaField label="Next Service" primary={displayNextDate} />
      </div>

      {/* ── EXPANDABLE: NOTES & PARTS ── */}
      <div className="flex flex-wrap gap-4 mb-4 relative z-10">
        {service.notes && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotesOpen(!notesOpen);
            }}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            {notesOpen ? (
              <ChevronDown size={14} className="rotate-180" />
            ) : (
              <ChevronRight size={14} />
            )}
            Service Notes
          </button>
        )}
        {partsCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPartsOpen(!partsOpen);
            }}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            {partsOpen ? (
              <ChevronDown size={14} className="rotate-180" />
            ) : (
              <ChevronRight size={14} />
            )}
            Parts Used ({partsCount})
          </button>
        )}
      </div>

      {notesOpen && service.notes && (
        <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-4 text-sm text-slate-500 italic border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-widest">
            Note:
          </span>
          {service.notes}
        </div>
      )}

      {partsOpen && partsCount > 0 && (
        <div className="bg-slate-50 rounded-2xl px-4 capitalize py-3 mb-4 border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <PartsUsedList parts={service.partsUsed} />
          {partsTotal > 0 && (
            <div className="flex justify-end items-center gap-2 pt-2 mt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Total:
              </span>
              <span className="text-sm font-bold text-slate-800">
                ₹{partsTotal.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM ROW: actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(service);
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
          View Profile
        </button>

        <div className="flex items-center gap-2">
          {role === "mechanic" ? (
            isAssignedMechanic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(service);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition active:scale-95 shadow-sm"
              >
                Update Work
              </button>
            )
          ) : (
            <>
              {(role === "owner" ||
                role === "admin" ||
                (role === "advisor" &&
                  (service.advisorId?._id === userId ||
                    service.advisorId === userId))) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(service);
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
              )}

              {(role === "owner" || role === "admin") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(service._id || service.id);
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
