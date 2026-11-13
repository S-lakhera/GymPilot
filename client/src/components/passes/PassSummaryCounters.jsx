import React from "react";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Metric summary card displaying pass lifecycle totals.
 *
 * @param {{
 *   counters: {
 *     active: number,
 *     queued: number,
 *     past: number,
 *     totalInvested: number
 *   }
 * }} props
 */
export function PassSummaryCounters({ counters }) {
  const items = [
    {
      label: "Active Passes",
      value: counters.active,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      description: "Live access memberships",
    },
    {
      label: "Queued Renewals",
      value: counters.queued,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      description: "Auto-activates on expiry",
    },
    {
      label: "Completed & Past",
      value: counters.past,
      color: "text-zinc-400",
      bg: "bg-zinc-800/40 border-zinc-700/50",
      description: "Expired or cancelled passes",
    },
    {
      label: "Total Invested",
      value: formatCurrency(counters.totalInvested),
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      description: "Cumulative pass expenditure",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border ${item.bg} backdrop-blur-sm transition-all`}
        >
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
            {item.label}
          </div>
          <div className={`mt-2 text-2xl font-bold font-heading ${item.color}`}>
            {item.value}
          </div>
          <div className="mt-1 text-xs text-zinc-500 truncate">
            {item.description}
          </div>
        </div>
      ))}
    </div>
  );
}


