import React from "react";
import { formatDate, formatCurrency } from "../../utils/formatters.js";

/**
 * Promotional discounts ledger table.
 *
 * @param {{
 *   discounts: Array<Object>,
 *   onEditDiscount: (discount: Object) => void,
 *   onToggleStatus: (discount: Object) => void
 * }} props
 */
export function DiscountTable({ discounts, onEditDiscount, onToggleStatus }) {
  if (!discounts || discounts.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">No promotional coupons found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Coupon Code & Name</th>
            <th className="py-3.5 px-4">Discount Value</th>
            <th className="py-3.5 px-4">Validity Period</th>
            <th className="py-3.5 px-4">Usage Count</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {discounts.map((d) => {
            const isActive = Boolean(d.is_active);
            const isPercent = d.discount_type === "PERCENTAGE";

            return (
              <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-100 bg-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-700/50">
                      {d.code}
                    </span>
                    <span className="font-semibold text-zinc-200">{d.name}</span>
                  </div>
                  {d.description && (
                    <div className="text-[11px] text-zinc-400 max-w-sm truncate mt-0.5">
                      {d.description}
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-bold text-emerald-400 text-sm">
                    {isPercent ? `${d.discount_value}%` : formatCurrency(d.discount_value)}
                  </div>
                  {isPercent && d.max_discount_amount && (
                    <div className="text-[10px] text-zinc-400">
                      Cap: {formatCurrency(d.max_discount_amount)}
                    </div>
                  )}
                  {d.min_purchase_amount > 0 && (
                    <div className="text-[10px] text-zinc-500">
                      Min order: {formatCurrency(d.min_purchase_amount)}
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300">
                  {formatDate(d.start_date)} – {formatDate(d.end_date)}
                </td>

                <td className="py-3.5 px-4 font-mono text-zinc-300">
                  {d.used_count || 0} / {d.usage_limit ? d.usage_limit : "∞"}
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        isActive ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    />
                    {isActive ? "Active" : "Archived"}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    onClick={() => onEditDiscount(d)}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(d)}
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    }`}
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
