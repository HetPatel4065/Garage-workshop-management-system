import React from "react";

const Skeleton = ({ className, width, height, borderRadius = "0.75rem" }) => {
  return (
    <div
      className={`skeleton-shimmer bg-gray-200 dark:bg-gray-800 relative overflow-hidden ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
        borderRadius: borderRadius,
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
    <Skeleton width="40%" height="1.5rem" />
    <Skeleton width="90%" height="1rem" />
    <Skeleton width="70%" height="1rem" />
    <div className="flex gap-2 pt-2">
      <Skeleton width="4rem" height="2rem" borderRadius="0.5rem" />
      <Skeleton width="4rem" height="2rem" borderRadius="0.5rem" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="20%" height="1.25rem" />
      ))}
    </div>
    <div className="divide-y divide-gray-100">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
          <div className="flex-1 space-y-2">
            <Skeleton width="30%" height="1rem" />
            <Skeleton width="20%" height="0.75rem" />
          </div>
          <Skeleton width="15%" height="1.5rem" borderRadius="0.5rem" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
