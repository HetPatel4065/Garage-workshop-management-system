import React from "react";
import {
  User,
  Wrench,
  Calendar,
  Car,
  ChevronRight,
  UserCheck,
} from "lucide-react";

function RecentServices({ services = [] }) {
  // Empty State View
  if (!services.length) {
    return (
      <div className="p-6">
        <div className="py-20 text-center bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
          <div className="flex items-center justify-center mx-auto mb-4 w-14 h-14 bg-white border border-slate-50 rounded-2xl shadow-sm">
            <Car className="text-slate-200" size={28} />
          </div>
          <p className="font-bold tracking-tight text-slate-500">
            No active services
          </p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
            Check-ins will appear here
          </p>
        </div>
      </div>
    );
  }

  // Helper for Status Badges
  const getStatusStyle = (status) => {
    const styles = {
      Completed: "bg-emerald-500/10 text-emerald-600 border-emerald-100/50",
      "In Progress": "bg-amber-500/10 text-amber-600 border-amber-100/50",
      Cancelled: "bg-rose-500/10 text-rose-600 border-rose-100/50",
      Ready: "bg-blue-500/10 text-blue-600 border-blue-100/50",
    };
    return styles[status] || "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <div className="p-1 space-y-4 max-h-160 overflow-y-auto custom-scrollbar">
      {services.slice(0, 5).map((s) => (
        <div
          key={s._id}
          className="group relative flex flex-col md:flex-row justify-between md:items-center gap-5 p-5 bg-white border border-slate-100 rounded-4xl overflow-hidden cursor-auto transition-all duration-500 hover:border-blue-100 hover:shadow-2xl hover:shadow-slate-200/40"
        >
          {/* Section 1: Vehicle & Customer Detail */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Visual Indicator Icon */}
            <div className="hidden sm:flex items-center justify-center shrink-0 w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl">
              <Wrench size={22} strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Vehicle Identity Header */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-black text-slate-900 truncate transition-colors group-hover:text-blue-600">
                  {s.vehicle?.make} {s.vehicle?.model || "Vehicle"}
                </h4>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded-md">
                  {s.vehicle?.licensePlate || "N/A"}
                </span>
              </div>

              {/* Customer & Target Service Names */}
              <div className="flex flex-wrap items-center gap-x-2 mb-3">
                <span className="text-[13px] font-bold text-slate-700">
                  {s.customerId?.name || "Guest"}
                </span>
                <span className="text-slate-200">•</span>
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-tight line-clamp-1">
                  {s.selectedServices?.length > 0
                    ? s.selectedServices.map((i) => i.name).join(", ")
                    : "Standard Service"}
                </span>
              </div>

              {/* Dynamic Badges for Staff Assignment */}
              <div className="flex flex-wrap gap-2">
                {s.mechanicId?.name && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tighter">
                      Mechanic: {s.mechanicId.name}
                    </span>
                  </div>
                )}

                {s.advisorId?.name && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-900/50 rounded-lg">
                    <UserCheck size={12} className="text-indigo-400" />
                    <span className="text-[9.5px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter">
                      Advisor: {s.advisorId.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Current Status Badge & Logged Date */}
          <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
            <div
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border rounded-xl shadow-sm ${getStatusStyle(
                s.status,
              )}`}
            >
              {s.status}
            </div>

            <div className="flex items-center gap-1.5 font-bold text-slate-400">
              <Calendar size={13} strokeWidth={3} />
              <span className="text-[11px]">
                {s.createdAt
                  ? new Date(s.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })
                  : "--/--"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentServices;
