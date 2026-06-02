import React from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

export function StatsGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full auto-rows-fr">
      {children}
    </div>
  );
}

export default function StatsCard({
  title,
  value,
  icon,
  color = "blue",
  trend,
  sparklineData = [],
  children,
}) {
  // Enhanced color map to support both light and dark aesthetics gracefully
  const colorMap = {
    blue: {
      bg: "bg-blue-500/10 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      chart: "#3b82f6",
    },
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      chart: "#22c55e",
    },
    yellow: {
      bg: "bg-amber-500/10 dark:bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      chart: "#f59e0b",
    },
    red: {
      bg: "bg-red-500/10 dark:bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      chart: "#ef4444",
    },
    purple: {
      bg: "bg-purple-500/10 dark:bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      chart: "#a855f7",
    },
    indigo: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
      chart: "#6366f1",
    },
  };

  const theme = colorMap[color] || colorMap.blue;
  const isPositiveTrend = trend && !trend.startsWith("-");

  return (
    <div className="group relative bg-white dark:bg-[#16161a] rounded-2xl p-6 shadow-md dark:shadow-xl border border-zinc-200 dark:border-zinc-800/40 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:-translate-y-1.5 hover:-translate-x-1.5">
      {/* Top Section: Icon & Optional Trend */}
      <div className="flex justify-between items-start mb-5 z-10">
        <div
          className={`p-3 rounded-xl ${theme.bg} ${theme.text} transition-all duration-300 shadow-inner`}
        >
          {icon && React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
        </div>

        {trend && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide ${
              isPositiveTrend
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Primary Value Section */}
      <div className="space-y-1 relative z-10 flex-1 min-w-0">
        <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-widest uppercase">
          {title}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl sm:text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
            {value}
          </p>
        </div>
      </div>

      {/* Slot for anything extra */}
      {children && <div className="mt-4 relative z-10">{children}</div>}

      {/* Sparkline Overlay */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 w-full opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition-all duration-500 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparklineData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`gradient-${color}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={theme.chart} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={theme.chart} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.chart}
                strokeWidth={1.5}
                fill={`url(#gradient-${color})`}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
