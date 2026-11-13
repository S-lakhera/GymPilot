import React from "react";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";

/**
 * Admin payments transaction ledger table.
 *
 * @param {{
 *   payments: Array<Object>,
 *   onRequestRefund: (payment: Object) => void
 * }} props
 */
export function TransactionLedgerTable({ payments, onRequestRefund }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">No payment transactions match your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Transaction / Ref</th>
            <th className="py-3.5 px-4">Member</th>
            <th className="py-3.5 px-4">Plan</th>
            <th className="py-3.5 px-4">Method</th>
            <th className="py-3.5 px-4">Amount</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {payments.map((p) => {
            const amount = Number(p.amount) || 0;
            const refundedAmount = Number(p.refunded_amount) || 0;
            const remainingBalance = Math.max(0, amount - refundedAmount);
            const isRefundable =
              (p.payment_status === "COMPLETED" || p.payment_status === "PARTIALLY_REFUNDED") &&
              remainingBalance > 0;

            return (
              <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-mono text-zinc-200 font-semibold text-[11px]">
                    {p.transaction_reference || `TXN-${p.id}`}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    ID #{p.id}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-zinc-100">
                    {p.member_name || "Member"}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {p.member_email}
                  </div>
                </td>

                <td className="py-3.5 px-4 text-zinc-300">
                  {p.plan_name || "Membership Plan"}
                </td>

                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {p.payment_method || "UPI"}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-bold text-zinc-100">
                    {formatCurrency(amount)}
                  </div>
                  {refundedAmount > 0 && (
                    <div className="text-[10px] text-amber-400 font-mono">
                      -{formatCurrency(refundedAmount)} refunded
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      p.payment_status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : p.payment_status === "PARTIALLY_REFUNDED"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : p.payment_status === "REFUNDED"
                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {p.payment_status}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                  {formatDateTime(p.created_at)}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {isRefundable ? (
                    <button
                      type="button"
                      onClick={() => onRequestRefund(p)}
                      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                    >
                      Issue Refund
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-600 italic">No refund</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

