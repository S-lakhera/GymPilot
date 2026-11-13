import React from "react";

/**
 * Search and status filter bar for the Admin Member Directory.
 *
 * @param {{
 *   search: string,
 *   onSearchChange: (value: string) => void,
 *   statusFilter: 'all'|'active'|'inactive',
 *   onStatusFilterChange: (status: 'all'|'active'|'inactive') => void,
 *   totalRecords: number
 * }} props
 */
export function MemberSearchFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalRecords,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Status Filter Buttons & Total Records Badge */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-emerald-500 text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "active"
                ? "bg-emerald-500 text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "inactive"
                ? "bg-rose-500 text-zinc-100 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Inactive
          </button>
        </div>

        <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700/50">
          {totalRecords} member{totalRecords === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
