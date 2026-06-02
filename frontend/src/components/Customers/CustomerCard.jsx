function MetaField({ label, primary, secondary, icon: Icon, className = "" }) {
  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      <p className="text-[9px] sm:text-[12px] uppercase font-black tracking-wide text-slate-600 border-b-2 border-slate-200 w-fit pb-0.5 mb-1.5 flex items-center gap-1 whitespace-nowrap">
        {/* Updated: icon now shows on both mobile and desktop for better UI */}
        {Icon && <Icon size={14} className="text-slate-700" />}
        {label}
      </p>

      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-normal break-all sm:break-word">
        {primary || "—"}
      </p>

      {secondary && (
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 break-word">
          {secondary}
        </p>
      )}
    </div>
  );
}

export default function CustomerCard({
  customer,
  onEdit,
  onDelete,
  onView,
  role,
  onVehicleHistory,
  onApprove,
  onReject,
}) {
  const STATUS_META = {
    Active:
      "text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100 border-emerald-100",
    Inactive: "text-gray-600 dark:bg-gray-700/50 bg-gray-100 border-gray-100",
    Blocked: "text-red-700 dark:bg-red-950/50 bg-red-100 border-red-100",
    Pending: "text-blue-700 dark:bg-blue-950/90 bg-blue-100 border-blue-100",
    Rejected:
      "text-orange-700 dark:bg-orange-950/50 bg-orange-100 border-orange-100",
  };

  const normalizedStatus = [
    "Active",
    "Inactive",
    "Blocked",
    "Pending",
    "Rejected",
  ].includes(customer?.status)
    ? customer.status
    : "Active";

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group cursor-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            {customer.name || "Unnamed Customer"}
          </h3>
          <span className="px-2 py-0.5  bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
            #
            {customer.customerId ||
              customer._id?.slice(-6)?.toUpperCase() ||
              "N/A"}
          </span>
          <span
            className={`px-2 py-0.5 border text-[10px] font-black tracking-widest rounded-lg uppercase ${STATUS_META[normalizedStatus]}`}
          >
            {normalizedStatus}
          </span>
        </div>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-4">
        <MetaField label="Contact" primary={customer.phone || "No Phone"} />
        <MetaField label="Email" primary={customer.email || "—"} />
        <MetaField
          label="Location"
          primary={customer.address?.city || "—"}
          className="col-span-1"
        />
        <MetaField
          label="Joined Date"
          primary={
            customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>

      {/* ── VEHICLE CHIPS section if applicable ── */}
      {customer.vehicles?.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-3" />
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Registered Vehicles ({customer.vehicles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {customer.vehicles.slice(0, 5).map((v, i) => (
                <div
                  key={v._id || i}
                  className="bg-blue-50/50 border border-blue-100 text-[11px] font-bold text-blue-700 px-3 py-1.5 rounded-xl flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  {v.make} {v.model}
                  {v.licensePlate && (
                    <span className="font-mono text-blue-400 bg-white px-1.5 py-0.5 rounded border border-blue-100 text-[9px]">
                      {v.licensePlate}
                    </span>
                  )}
                </div>
              ))}
              {customer.vehicles.length > 5 && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  +{customer.vehicles.length - 5} More
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── DIVIDER ── */}
      <div className="border-t border-gray-100 my-3" />

      {/* ── BOTTOM ROW: actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        <button
          onClick={() => onView(customer)}
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
          {role !== "mechanic" && role !== "advisor" && (
            <>
              <button
                onClick={() => onEdit(customer)}
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
                onClick={() => onDelete(customer._id)}
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
            </>
          )}

          {customer.status === "Pending" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onApprove(customer._id)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition active:scale-95 shadow-sm shadow-emerald-100"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(customer._id)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition active:scale-95 shadow-sm shadow-orange-100"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
