import React from "react";
import { Wrench } from "lucide-react";
import { FaCar } from "react-icons/fa";
import { HiDocumentCurrencyRupee } from "react-icons/hi2";

const DashboardStats = ({ vehicleCount, serviceCount, invoiceCount }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
    <div className="bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-4xl p-5 sm:p-8 border border-slate-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="w-12 sm:w-14 h-12 sm:h-14 bg-blue-50 dark:bg-blue-950/30 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
        <FaCar className="w-6 sm:w-7 h-6 sm:h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
        {vehicleCount}
      </h3>
      <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
        Registered Vehicles
      </p>
    </div>
    <div className="bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-4xl p-5 sm:p-8 border border-slate-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="w-12 sm:w-14 h-12 sm:h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
        <Wrench className="w-6 sm:w-7 h-6 sm:h-7 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
        {serviceCount}
      </h3>
      <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
        Total Services
      </p>
    </div>
    <div className="bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-4xl p-5 sm:p-8 border border-slate-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="w-12 sm:w-14 h-12 sm:h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
        <HiDocumentCurrencyRupee className="w-6 sm:w-7 h-6 sm:h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
        {invoiceCount}
      </h3>
      <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
        Invoices Generated
      </p>
    </div>
  </div>
);

export default DashboardStats;
