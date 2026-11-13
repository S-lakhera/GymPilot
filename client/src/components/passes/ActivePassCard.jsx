import React from "react";
import { Link } from "react-router-dom";
import { formatDate, formatCurrency, getDaysRemaining } from "../../utils/formatters.js";
import { ROUTES } from "../../utils/constants.js";

/**
 * Card representing an active gym membership pass.
 *
 * @param {{ pass: Object }} props
 */
export function ActivePassCard({ pass }) {
  const daysRemaining = getDaysRemaining(pass.end_date);
  const isExpiringSoon = daysRemaining <= 7;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg hover:border-zinc-700 transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative top border highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Active Pass
          </span>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            {pass.category_name || "General"}
          </span>
        </div>

        {/* Plan Title & Expiration Callout */}
        <h3 className="text-xl font-bold text-zinc-100 font-heading tracking-tight">
          {pass.plan_name}
        </h3>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-sm font-semibold ${
              isExpiringSoon ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {daysRemaining === 0
              ? "Expiring today"
              : `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}
          </span>
        </div>

        {/* Validity Period */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Pass Start Date</span>
            <span className="font-medium text-zinc-300">{formatDate(pass.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Pass End Date</span>
            <span className="font-medium text-zinc-300">{formatDate(pass.end_date)}</span>
          </div>
          {pass.discount_code && (
            <div className="flex justify-between text-emerald-400/90 pt-1">
              <span>Discount Applied</span>
              <span className="font-mono">{pass.discount_code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Details & Action */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Fee Paid</div>
          <div className="text-lg font-bold text-zinc-100">
            {formatCurrency(pass.price_paid ?? pass.final_amount)}
          </div>
        </div>

        <Link
          to={`${ROUTES.PLANS}?category=${pass.category_id || ""}`}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm"
        >
          Renew Pass
        </Link>
      </div>
    </div>
  );
}


