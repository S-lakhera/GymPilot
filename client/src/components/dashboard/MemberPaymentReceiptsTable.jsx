import React from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { ReceiptText, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Member Payment Receipts Ledger.
 * Scoped strictly to the member's personal payment history.
 *
 * @param {{
 *   payments?: Array<Object>
 * }} props
 */
export function MemberPaymentReceiptsTable({ payments = [] }) {
  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-display text-text-primary">
            Recent Payment Receipts
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Your recent gym membership billing and checkout records
          </p>
        </div>
        <Link
          to={ROUTES.BILLING || ROUTES.PASSES}
          className="text-xs font-semibold text-emerald-accent hover:text-emerald-dark inline-flex items-center gap-1 transition-colors"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary border border-dashed border-workspace-border rounded-xl">
          <ReceiptText className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-text-primary">No Payment Receipts</p>
          <p className="text-xs mt-1">Receipts will be listed here after pass purchases.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-workspace-border text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-3">Date</th>
                <th className="py-2.5 px-3">Plan Description</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-workspace-border/50 text-text-primary">
              {payments.map((p) => (
                <tr key={p.paymentId} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 pr-3 text-text-secondary whitespace-nowrap">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-text-primary whitespace-nowrap">
                    {p.planName}
                  </td>
                  <td className="py-3 px-3 text-text-secondary whitespace-nowrap uppercase">
                    {p.paymentMethod || "UPI"}
                  </td>
                  <td className="py-3 px-3 text-text-muted font-mono text-[11px] whitespace-nowrap">
                    {p.transactionReference || "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-text-primary whitespace-nowrap">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="py-3 pl-3 text-center whitespace-nowrap">
                    <StatusBadge status={p.paymentStatus} type="payment" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MemberPaymentReceiptsTable;

