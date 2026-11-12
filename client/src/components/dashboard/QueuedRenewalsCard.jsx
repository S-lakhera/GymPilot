import React from "react";
import { formatDate, formatCurrency } from "../../utils/formatters.js";
import { CalendarClock, CheckCircle, Clock } from "lucide-react";

/**
 * Queued Renewals Card for Members.
 * Renders scheduled upcoming subscriptions.
 *
 * @param {{
 *   queuedRenewals?: Array<Object>
 * }} props
 */
export function QueuedRenewalsCard({ queuedRenewals = [] }) {
  if (queuedRenewals.length === 0) return null;

  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-text-primary">
            Upcoming Scheduled Renewals ({queuedRenewals.length})
          </h3>
          <p className="text-xs text-text-secondary">
            These passes are scheduled to activate automatically upon current pass expiration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {queuedRenewals.map((renewal) => (
          <div
            key={renewal.subscriptionId}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md text-[11px]">
                  {renewal.categoryName}
                </span>
                <span className="font-bold text-text-primary">
                  {formatCurrency(renewal.finalAmount, renewal.currency)}
                </span>
              </div>
              <div className="font-bold text-sm text-text-primary">
                {renewal.planName}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-1 border-t border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Starts on: <strong>{formatDate(renewal.startDate)}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QueuedRenewalsCard;
