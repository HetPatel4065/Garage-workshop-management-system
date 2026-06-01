export default function LowStockBadge({ stock, threshold }) {
  if (stock > threshold) return null;

  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-widest transition-colors duration-200
        bg-red-50 text-red-700 border-red-200 
        dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
    >
      Low (Min: {threshold})
    </span>
  );
}