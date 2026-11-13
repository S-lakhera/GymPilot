import React from "react";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Admin membership plans data table.
 *
 * @param {{
 *   plans: Array<Object>,
 *   onEditPlan: (plan: Object) => void,
 *   onToggleStatus: (plan: Object) => void
 * }} props
 */
export function AdminPlanTable({ plans, onEditPlan, onToggleStatus }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">No membership plans match your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Plan Name</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Price</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {plans.map((plan) => {
            const isActive = Boolean(plan.is_active);

            return (
              <tr key={plan.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-zinc-100 text-sm">
                    {plan.name}
                  </div>
                  {plan.description && (
                    <div className="text-[11px] text-zinc-400 max-w-sm truncate mt-0.5">
                      {plan.description}
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {plan.category_name || "General"}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-zinc-200 font-medium">
                  {plan.duration_days} Day{plan.duration_days === 1 ? "" : "s"}
                </td>

                <td className="py-3.5 px-4 font-bold text-zinc-100">
                  {formatCurrency(plan.price)}
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
                    onClick={() => onEditPlan(plan)}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(plan)}
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
