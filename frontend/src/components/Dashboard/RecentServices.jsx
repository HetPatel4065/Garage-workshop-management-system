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
  if (!services.length) {
    return (
      <div className="p-6">
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
          <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-50">
            <Car className="text-slate-200" size={28} />
          </div>
          <p className="text-slate-500 font-bold tracking-tight">
            No active services
          </p>
          <p className="text-slate-400 text-[11px] mt-1 uppercase font-black tracking-widest">
            Check-ins will appear here
          </p>
        </div>
      </div>
    );
  }

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
    /* Cleaned up the spacing and height */
    <div className="space-y-4 p-1 max-h-160 overflow-y-auto custom-scrollbar">
      {services.slice(0, 5).map((s) => (
        <div
          key={s._id}
          className="group relative bg-white border border-slate-100 p-5 rounded-4xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-2xl hover:shadow-slate-200/40 hover:border-blue-100 transition-all duration-500 cursor-auto overflow-hidden"
        >
          {/* Section 1: Vehicle & Customer */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Service Icon with soft background */}
            <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-slate-50 items-center justify-center text-slate-400 shrink-0">
              <Wrench size={22} strokeWidth={2.5} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {s.vehicle?.make} {s.vehicle?.model || "Vehicle"}
                </h4>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md uppercase tracking-wider">
                  {s.vehicle?.licensePlate || "N/A"}
                </span>
              </div>

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

              {/* Assignments: Styled as modern badges */}
              <div className="flex flex-wrap gap-2">
                {s.mechanicId?.name && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
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

          {/* Section 2: Status & Time */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
            <div
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyle(
                s.status,
              )}`}
            >
              {s.status}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
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
