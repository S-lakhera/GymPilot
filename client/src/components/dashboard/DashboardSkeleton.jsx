import React from "react";

/**
 * Accessible Dashboard Loading Skeleton.
 *
 * @param {{
 *   role?: 'admin'|'trainer'|'member'
 * }} props
 */
export function DashboardSkeleton({ role = "member" }) {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto" aria-busy="true" aria-label="Loading dashboard metrics">
      {/* Top Banner Skeleton */}
      <div className="h-28 bg-slate-200/80 rounded-2xl w-full" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200/70 rounded-2xl p-5 space-y-2">
            <div className="h-3 bg-slate-300 rounded w-1/2" />
            <div className="h-8 bg-slate-300 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-200/70 rounded-2xl" />
        <div className="h-72 bg-slate-200/70 rounded-2xl" />
      </div>

      {/* Bottom Table Skeleton */}
      <div className="h-64 bg-slate-200/60 rounded-2xl" />
    </div>
  );
}

export default DashboardSkeleton;
