import LowStockBadge from "./LowStockBadge";

function MetaField({ label, primary, secondary, icon: Icon, className = "" }) {
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

export default function InventoryItemCard({
  item,
  role,
  onEdit,
  onDelete,
  onView,
  onUpdateStock,
}) {
  const stock = item?.stock ?? 0;
  const retail = item?.retailPrice ?? 0;
  const cost = item?.costPrice ?? 0;
  const isMechanic = role === "mechanic";

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group cursor-auto">
      {/* ── TOP ROW: Name + SKU + Stock status ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold capitalize text-gray-900 tracking-tight">
            {item.name || "Unnamed Item"}
          </h3>
          {item.sku && (
            <span className="px-2 py-0.5  bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
              {item.sku}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg border border-slate-200">
            <span className="text-[11.5px] font-black uppercase text-slate-600 tracking-normal">
              Stock
            </span>
            <span
              className={`text-sm font-bold ${
                stock <= (item.minLimit ?? 0) ? "text-red-600" : "text-gray-900"
              }`}
            >
              {stock}
            </span>
          </div>
          <LowStockBadge stock={stock} threshold={item.minLimit ?? 0} />
        </div>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-4">
        <MetaField label="Supplier" primary={item?.supplier?.name || "N/A"} />
        <MetaField
          label="Vehicle"
          primary={item?.carModel || "Universal"}
          secondary={
            item?.carYear && item.carYear !== "All Years"
              ? `Year: ${item.carYear}`
              : null
          }
        />
        {!isMechanic && (
          <MetaField
            label="Cost Price"
            primary={`₹${cost.toLocaleString("en-IN")}`}
          />
        )}
        <MetaField
          label="Retail Price"
          primary={`₹${retail.toLocaleString("en-IN")}`}
        />
      </div>

      {/* ── DIVIDER ── */}
      <div className="border-t border-slate-200 my-4" />
      {/* ── BOTTOM ROW: actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        {isMechanic ? (
          <button
            onClick={() => onEdit(item)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition active:scale-95"
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
        ) : (
          <>
            <button
              onClick={() => onUpdateStock(item)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-amber-700 dark:bg-amber-950/50 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition active:scale-95"
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Update Stock
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(item)}
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
              <button
                onClick={() => onEdit(item)}
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
                onClick={() => onDelete(item._id)}
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
          </>
        )}
      </div>
    </div>
  );
}
