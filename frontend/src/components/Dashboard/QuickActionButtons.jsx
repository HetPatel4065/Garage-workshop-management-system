import { Users, Wrench, Package } from "lucide-react";

export default function QuickActionButtons({
  onAddCustomer,
  onAddService,
  onAddInventory,
  role,
}) {
  const isMechanic = role === "mechanic" || role === "advisor";

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-8">
      {/* Customer Action Button */}
      <button
        onClick={onAddCustomer}
        className="group flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.02)] hover:bg-slate-900 hover:border-slate-900 hover:text-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95"
      >
        <Users
          size={16}
          className="transition-transform group-hover:scale-125"
        />
        {isMechanic ? "Directory" : "New Customer"}
      </button>

      {/* Service Action Button */}
      <button
        onClick={onAddService}
        className="group flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 dark:bg-blue-950/90 text-white font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-95"
      >
        <Wrench
          size={16}
          className="transition-transform group-hover:scale-125 group-hover:rotate-12"
        />
        Start Service
      </button>

      {/* Inventory Action Button */}
      <button
        onClick={onAddInventory}
        className="group flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.02)] hover:bg-slate-900 hover:border-slate-900 hover:text-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95"
      >
        <Package
          size={16}
          className="transition-transform group-hover:scale-125"
        />
        {isMechanic ? "Stock" : "Inventory"}
      </button>
    </div>
  );
}
