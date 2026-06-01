import { Users, Wrench, Package } from "lucide-react";

export default function QuickActionButtons({
  onAddCustomer,
  onAddService,
  onAddInventory,
  role,
}) {
  const isMechanic = role === "mechanic";

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 mb-8">
      <button
        onClick={onAddCustomer}
        className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white hover:bg-slate-900 border-2 border-slate-100 hover:border-slate-900 text-slate-600 hover:text-white px-6 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 group text-xs uppercase tracking-widest"
      >
        <Users
          size={16}
          className="group-hover:scale-125 transition-transform"
        />
        {isMechanic ? "Directory" : "New Customer"}
      </button>

      <button
        onClick={onAddService}
        className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-95 group text-xs uppercase tracking-widest"
      >
        <Wrench
          size={16}
          className="group-hover:scale-125 transition-transform group-hover:rotate-12"
        />
        Start Service
      </button>

      <button
        onClick={onAddInventory}
        className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white hover:bg-slate-900 border-2 border-slate-100 hover:border-slate-900 text-slate-600 hover:text-white px-6 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 group text-xs uppercase tracking-widest"
      >
        <Package
          size={16}
          className="group-hover:scale-125 transition-transform"
        />
        {isMechanic ? "Stock" : "Inventory"}
      </button>
    </div>
  );
}
