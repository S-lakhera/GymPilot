import React from "react";

/**
 * Filter bar for transactions ledger.
 *
 * @param {{
 *   search: string,
 *   onSearchChange: (val: string) => void,
 *   statusFilter: string,
 *   onStatusFilterChange: (val: string) => void,
 *   methodFilter: string,
 *   onMethodFilterChange: (val: string) => void,
 *   totalRecords: number
 * }} props
 */
export function TransactionFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  totalRecords,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by member, email, or txn ref..."
          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

      {/* Method Dropdown & Status Chips */}
      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
        <select
          value={methodFilter}
          onChange={(e) => onMethodFilterChange(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="NET_BANKING">Net Banking</option>
        </select>

        <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "COMPLETED", label: "Completed" },
            { id: "PARTIALLY_REFUNDED", label: "Part. Refunded" },
            { id: "REFUNDED", label: "Refunded" },
            { id: "FAILED", label: "Failed" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onStatusFilterChange(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === st.id
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700/50">
          {totalRecords} records
        </span>
      </div>
    </div>
  );
}

