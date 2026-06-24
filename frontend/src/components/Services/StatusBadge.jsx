export default function StatusBadge({ status }) {
  const colorMap = {
    pending:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    "in-progress":
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    completed:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/200",
    cancelled:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };

  // Safe fallback to handle unknown statuses or undefined values gracefully
  const colorClass =
    colorMap[status?.toLowerCase()]
  return (
    <span
      className={`px-2 py-0.5  text-[10.5px] uppercase font-bold rounded-lg tracking-tight transition-colors duration-200 flex items-center gap-1  ${colorClass}`}
    >
      {(status || "").replace(/-/g, " ")}
    </span>
  );
}
