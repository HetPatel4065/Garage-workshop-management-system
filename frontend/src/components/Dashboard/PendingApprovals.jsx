import React from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PendingApprovals = ({ inspections = [] }) => {
  const navigate = useNavigate();

  if (inspections.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-50 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-100">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">
              Pending Approvals
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {inspections.length} New Request
              {inspections.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/requested-customers")}
          className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
        >
          View All
        </button>
      </div>

      {/* List */}
      <div className="px-4 pb-6 space-y-2">
        {inspections.slice(0, 5).map((insp) => (
          <div
            key={insp._id}
            onClick={() => navigate("/requested-customers")}
            className="group flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 transition-all cursor-auto"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-linear-to-br from-white to-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                {insp.customerName?.charAt(0).toUpperCase() || "C"}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                  {insp.customerName}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {insp.vehicleNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/50 text-blue-600 border border-blue-100">
              <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-tighter">
                New
              </span>
            </div>
          </div>
        ))}

        {inspections.length > 5 && (
          <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
            + {inspections.length - 5} more requests pending
          </p>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
