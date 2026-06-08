import React from "react";
import { NavLink } from "react-router-dom";

const TabButton = ({ to, end = false, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base transition-all shrink-0 whitespace-nowrap ${
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
          : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-zinc-800"
      }`
    }
  >
    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
    {label}
  </NavLink>
);

export default TabButton;
