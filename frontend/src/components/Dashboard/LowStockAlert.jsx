import React from "react";

export default function LowStockAlert({ items = [] }) {
  // Hide component if no inventory items are running low
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="group relative p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Header: Item Title & Criticality Level */}
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-bold capitalize text-slate-800 pr-2 transition-colors group-hover:text-blue-600">
              {item.name}
            </h4>
            <span className="px-2 py-0.5 bg-amber-100/50 border border-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter rounded-lg">
              Low
            </span>
          </div>

          {/* Metadata: Application Scope */}
          <p className="mb-3 text-[10px] font-bold uppercase tracking-tight text-slate-400">
            {item.carModel} {item.carYear && `• ${item.carYear}`}
          </p>

          {/* Footer: Count Tracker */}
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Stock
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black leading-none text-red-600">
                {item.stock}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                units
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
