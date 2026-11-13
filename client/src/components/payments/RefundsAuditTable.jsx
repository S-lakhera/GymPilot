import React from "react";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";

/**
 * Admin refunds audit log data table.
 *
 * @param {{ refunds: Array<Object> }} props
 */
export function RefundsAuditTable({ refunds }) {
  if (!refunds || refunds.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">
          No refunds have been processed in this period.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Refund Ref / ID</th>
            <th className="py-3.5 px-4">Payment Ref</th>
            <th className="py-3.5 px-4">Member</th>
            <th className="py-3.5 px-4">Refund Amount</th>
            <th className="py-3.5 px-4">Reason</th>
            <th className="py-3.5 px-4">Processed At</th>
            <th className="py-3.5 px-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {refunds.map((r) => (
            <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
              <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                {r.gateway_refund_reference || `RFND-${r.id}`}
                <div className="text-[10px] text-zinc-500 font-normal">
                  ID #{r.id}
                </div>
              </td>

              <td className="py-3.5 px-4 font-mono text-zinc-400">
                {r.payment_reference || `TXN-${r.payment_id}`}
              </td>

              <td className="py-3.5 px-4 font-medium text-zinc-100">
                {r.member_name || "Member"}
              </td>

              <td className="py-3.5 px-4 font-bold text-amber-400">
                {formatCurrency(r.amount)}
              </td>

              <td className="py-3.5 px-4 text-zinc-300 max-w-xs truncate">
                {r.reason}
              </td>

              <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                {formatDateTime(r.created_at)}
              </td>

              <td className="py-3.5 px-4 text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {r.refund_status || "COMPLETED"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
