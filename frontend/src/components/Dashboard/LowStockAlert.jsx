import React from "react";

export default function LowStockAlert({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="group bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-bold capitalize text-slate-800 pr-2 group-hover:text-blue-600 transition-colors">
              {item.name}
            </h4>
            <span className="bg-amber-100/50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter border border-amber-100">
              Low
            </span>
          </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-3">
            {item.carModel} {item.carYear && `• ${item.carYear}`}
          </p>

          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Stock
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-red-600 leading-none">
                {item.stock}
              </span>
              <span className="text-[10px] font-bold text-slate-400">units</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

