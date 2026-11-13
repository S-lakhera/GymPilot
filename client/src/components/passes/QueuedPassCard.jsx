import React from "react";
import { formatDate, formatCurrency } from "../../utils/formatters.js";

/**
 * Card representing a queued upcoming renewal pass.
 *
 * @param {{
 *   pass: Object,
 *   onRequestCancel: (pass: Object) => void,
 *   cancelling?: boolean
 * }} props
 */
export function QueuedPassCard({ pass, onRequestCancel, cancelling = false }) {
  return (
    <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
      {/* Top amber accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            Queued Renewal
          </span>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            {pass.category_name || "General"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-zinc-100 font-heading tracking-tight">
          {pass.plan_name}
        </h3>

        {/* Activation Notice */}
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          Scheduled to activate automatically when your current pass expires on{" "}
          <span className="font-semibold text-amber-200">{formatDate(pass.start_date)}</span>.
        </div>

        {/* Validity */}
        <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Scheduled Start</span>
            <span className="font-medium text-zinc-300">{formatDate(pass.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Scheduled End</span>
            <span className="font-medium text-zinc-300">{formatDate(pass.end_date)}</span>
          </div>
          {pass.discount_code && (
            <div className="flex justify-between text-emerald-400/90 pt-1">
              <span>Promo Code Applied</span>
              <span className="font-mono">{pass.discount_code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Fee Paid</div>
          <div className="text-lg font-bold text-zinc-100">
            {formatCurrency(pass.price_paid ?? pass.final_amount)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRequestCancel(pass)}
          disabled={cancelling}
          className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
        >
          Cancel Pass
        </button>
      </div>
    </div>
  );
}


