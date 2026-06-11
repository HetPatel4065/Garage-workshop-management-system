import React from "react";
import Skeleton, { CardSkeleton, TableSkeleton } from "../../components/UI/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen bg-gray-50">
      
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-3">
          <Skeleton width="180px" height="1rem" />
          <Skeleton width="280px" height="2.5rem" borderRadius="1rem" />
        </div>
        <div className="flex gap-2">
          <Skeleton width="120px" height="2.5rem" borderRadius="0.75rem" />
          <Skeleton width="120px" height="2.5rem" borderRadius="0.75rem" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 space-y-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
          >
            <Skeleton width="2.5rem" height="2.5rem" borderRadius="0.75rem" />
            <Skeleton width="70%" height="1.25rem" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Major Chart Area (e.g., Line/Bar Chart) */}
        <div className="lg:col-span-2 p-6 space-y-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Skeleton width="2.5rem" height="2.5rem" borderRadius="1rem" />
              <Skeleton width="180px" height="1.5rem" />
            </div>
            <Skeleton width="100px" height="2rem" borderRadius="0.75rem" />
          </div>
          <Skeleton width="100%" height="220px" borderRadius="1rem" />
        </div>

        {/* Secondary Chart Area (e.g., Donut/Pie Chart) */}
        <div className="p-6 space-y-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton width="2.5rem" height="2.5rem" borderRadius="1rem" />
            <Skeleton width="120px" height="1.25rem" />
          </div>
          <div className="flex justify-center items-center py-8">
            <Skeleton width="180px" height="180px" borderRadius="50%" />
          </div>
        </div>
      </div>

      {/* Bottom Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Data Table */}
        <div className="lg:col-span-2">
          <TableSkeleton rows={4} />
        </div>

        {/* Sidebar Mini-cards */}
        <div className="space-y-6">
          <div className="p-6 space-y-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <Skeleton width="100%" height="120px" borderRadius="1rem" />
          </div>
          <div className="p-6 space-y-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <Skeleton width="100%" height="150px" borderRadius="1rem" />
          </div>
        </div>
      </div>

    </div>
  );
}