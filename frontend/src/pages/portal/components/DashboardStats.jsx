import React from "react";
import { Wrench,ReceiptText,IndianRupeeIcon, ReceiptIndianRupeeIcon } from "lucide-react";
import { FaCar } from "react-icons/fa";

const DashboardStats = ({
  vehicleCount = 0,
  serviceCount = 0,
  invoiceCount = 0,
  invoiceAmount = 0,
}) => {
  // Format currency cleanly to the Indian Numbering System (en-IN)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0, // Cleans up trailing .00 decimals
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Registered Vehicles */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors duration-300">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
          <FaCar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-1">
          {vehicleCount}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
          Registered Vehicles
        </p>
      </div>

      {/* Total Services */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors duration-300">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
          <Wrench className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-1">
          {serviceCount}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
          Total Services
        </p>
      </div>

      {/* Invoices Count */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors duration-300">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
          <ReceiptText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-1">
          {invoiceCount}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
          Invoices Generated
        </p>
      </div>

      {/* Total Amount Paid */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors duration-300">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
          <IndianRupeeIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1 truncate">
          {invoiceAmount > 0 ? formatCurrency(invoiceAmount) : "₹0"}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
          Total Spends
        </p>
      </div>
    </div>
  );
};

export default DashboardStats;
