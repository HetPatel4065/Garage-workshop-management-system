import { User, Wrench } from "lucide-react";

export default function UnbilledServiceCard({ service, onGenerate }) {
  const customerName =
    typeof service.customerId === "object"
      ? service.customerId?.name
      : "Unknown";

  const carModel = `${service.vehicle?.make || ""} ${
    service.vehicle?.model || ""
  }`.trim();

  const labour = Number(service?.labourCost || service?.labourAtTime || 0);
  const parts = Number(service?.partsTotal || 0);
  const catalog = Number(service?.catalogTotal || 0);
  const total = labour + parts + catalog;

  const displayDate =
    service.vehicleId?.serviceDate || service.createdAt
      ? new Date(
          service.vehicleId?.serviceDate || service.createdAt,
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const nextServiceDisplay = service.vehicleId?.nextServiceDate
    ? new Date(service.vehicleId.nextServiceDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full bg-white border border-gray-100 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-auto h-full">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 wrap-break-words leading-tight">
            {(() => {
              const tickedTasks = (service?.requestedServices || [])
                .filter((r) => r.status === "Done")
                .map((r) => r.description || "Task");

              if (tickedTasks.length === 0) {
                return <span>{service.serviceName || "General Service"}</span>;
              }

              return tickedTasks.map((t, i) => {
                const rawStr = String(t).replace(/\\n/g, " ");
                const formattedName =
                  rawStr.charAt(0).toUpperCase() + rawStr.slice(1);

                return (
                  <span key={i} className="text-gray-800">
                    {formattedName}
                    {i < tickedTasks.length - 1 && (
                      <span className="mx-2 text-gray-300 font-extrabold">
                        +
                      </span>
                    )}
                  </span>
                );
              });
            })()}
          </h3>

          <div className="mt-1 space-y-0.5">
            <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              Service Date • {displayDate}
            </p>
            {nextServiceDisplay && (
              <p className="text-indigo-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                Next Service • {nextServiceDisplay}
              </p>
            )}
          </div>

          {/* STAFF TAGS */}
          <div className="flex flex-wrap gap-2 mt-3">
            {service.advisorId?.name && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-indigo-100">
                <User size={10} className="shrink-0" />
                <span className="truncate max-w-25">
                  Ad: {service.advisorId.name}
                </span>
              </span>
            )}
            {service.mechanicId?.name && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-tight flex items-center gap-1 border border-slate-200">
                <Wrench size={10} className="shrink-0" />
                <span className="truncate max-w-25">
                  Me: {service.mechanicId.name}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* STATUS BADGE */}
        <span
          className={`text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full whitespace-nowrap self-start ${
            service.status === "Completed"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-blue-50 text-blue-600 border border-blue-100"
          }`}
        >
          {service.status?.toUpperCase()}
        </span>
      </div>

      {/* 2. CORE INFO - STRUCTURED VERTICAL GRID */}
      <div className="grid grid-cols-1 gap-2 text-sm mb-5">
        <div className="flex justify-between items-center gap-4 min-w-0">
          <span className="text-gray-500 font-medium shrink-0">Customer:</span>
          <span className="text-gray-800 font-semibold truncate text-right">
            {customerName}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 min-w-0">
          <span className="text-gray-500 font-medium shrink-0">Vehicle:</span>
          <span className="text-gray-800 font-semibold truncate text-right">
            {carModel || "Unconfirmed"}
          </span>
        </div>

        {service.vehicle?.licensePlate && (
          <div className="flex justify-between items-center gap-4 pt-2 border-t border-gray-50 mt-1 min-w-0">
            <span className="text-gray-400 text-[10px] font-bold shrink-0 uppercase tracking-tight">
              Plate:
            </span>
            <span className="text-gray-700 font-bold text-[11px] uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate">
              {service.vehicle.licensePlate}
            </span>
          </div>
        )}
      </div>

      {/* 3. COST BREAKDOWN */}
      <div className="bg-gray-800 border border-gray-100 rounded-xl p-4 mb-5 space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500 font-medium">Labour</span>
          <span className="font-semibold text-gray-800">
            ₹{labour.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500 font-medium">Parts</span>
          <span className="font-semibold text-gray-800">
            ₹{parts.toLocaleString()}
          </span>
        </div>

        {catalog > 0 && (
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Catalog</span>
            <span className="font-semibold text-gray-800">
              ₹{catalog.toLocaleString()}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Total Due
          </span>
          <span className="text-lg font-black text-blue-600">
            ₹{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4. FOOTER ACTION */}
      <div className="mt-auto">
        {service.description && (
          <p className="text-[11px] text-gray-400 mb-4 line-clamp-2 italic italic-none">
            "{service.description}"
          </p>
        )}

        <button
          onClick={() => onGenerate(service)}
          className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm uppercase tracking-tight">
            Generate Invoice
          </span>
        </button>
      </div>
    </div>
  );
}
