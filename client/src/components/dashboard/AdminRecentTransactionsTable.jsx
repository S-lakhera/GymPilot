import React from "react";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { ReceiptText, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Recent Transactions Audit Table for Administrators.
 *
 * @param {{
 *   transactions?: Array<Object>
 * }} props
 */
export function AdminRecentTransactionsTable({ transactions = [] }) {
  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-display text-text-primary">
            Recent Financial Transactions
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit log of completed, refunded, and pending collections
          </p>
        </div>
        <Link
          to={ROUTES.PAYMENTS}
          className="text-xs font-semibold text-emerald-accent hover:text-emerald-dark inline-flex items-center gap-1 transition-colors"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary border border-dashed border-workspace-border rounded-xl">
          <ReceiptText className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-text-primary">No Recent Transactions</p>
          <p className="text-xs mt-1">Payment receipts will appear as checkouts occur.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-workspace-border text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-3">Date</th>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-workspace-border/50 text-text-primary">
              {transactions.map((txn) => (
                <tr key={txn.paymentId} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 pr-3 text-text-secondary whitespace-nowrap">
                    {formatDateTime(txn.paymentDate)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-text-primary whitespace-nowrap">
                      {txn.memberName}
                    </div>
                    <div className="text-[11px] text-text-secondary truncate max-w-[140px]">
                      {txn.memberEmail}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium whitespace-nowrap">
                    {txn.planName}
                  </td>
                  <td className="py-3 px-3 text-text-secondary whitespace-nowrap uppercase">
                    {txn.paymentMethod || "UPI"}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-text-primary whitespace-nowrap">
                    {formatCurrency(txn.amount, txn.currency)}
                  </td>
                  <td className="py-3 pl-3 text-center whitespace-nowrap">
                    <StatusBadge status={txn.paymentStatus} type="payment" />
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

export default AdminRecentTransactionsTable;

