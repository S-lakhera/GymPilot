import React from "react";
import { Link } from "react-router-dom";
import { formatDate, formatCurrency } from "../../utils/formatters.js";
import { ROUTES } from "../../utils/constants.js";

/**
 * Historical passes ledger table for completed and cancelled subscriptions.
 *
 * @param {{ passes: Array<Object> }} props
 */
export function PastPassesTable({ passes }) {
  if (!passes || passes.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">No past or expired passes found in this view.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Membership Plan</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Active Period</th>
            <th className="py-3.5 px-4">Amount</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {passes.map((pass) => {
            const isCancelled = pass.status === "cancelled";
            return (
              <tr key={pass.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-zinc-100">
                  {pass.plan_name}
                  <div className="text-[10px] text-zinc-500 font-mono font-normal">
                    Ref #{pass.id}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-zinc-400">
                  {pass.category_name || "General"}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300">
                  {formatDate(pass.start_date)} – {formatDate(pass.end_date)}
                </td>
                <td className="py-3.5 px-4 font-medium text-zinc-200">
                  {formatCurrency(pass.price_paid ?? pass.final_amount)}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                      isCancelled
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                    }`}
                  >
                    {pass.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    to={`${ROUTES.PLANS}?category=${pass.category_id || ""}`}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    Re-subscribe →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


