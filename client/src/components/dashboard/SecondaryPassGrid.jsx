import React from "react";
import { formatDate } from "../../utils/formatters.js";
import { Ticket, Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Secondary Active Passes Grid for Members.
 * Renders concurrent active passes in other categories.
 *
 * @param {{
 *   passes: Array<Object>,
 *   queuedRenewals?: Array<Object>
 * }} props
 */
export function SecondaryPassGrid({ passes = [], queuedRenewals = [] }) {
  if (passes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider text-xs">
          Additional Active Passes ({passes.length})
        </h3>
        <Link
          to={ROUTES.PASSES}
          className="text-xs font-semibold text-emerald-accent hover:text-emerald-dark"
        >
          View All Passes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {passes.map((pass) => {
          const hasQueued = queuedRenewals.some(
            (q) => q.categoryName === pass.categoryName
          );
          const isExpiring = pass.daysRemaining <= 7;

          return (
            <div
              key={pass.subscriptionId}
              className="bg-workspace-card border border-workspace-border rounded-xl p-4 shadow-sm hover:border-brand-border/40 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {pass.categoryName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isExpiring
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-status-success"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {pass.daysRemaining} days left
                  </span>
                </div>

                <h4 className="text-base font-bold text-text-primary">
                  {pass.planName}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Until {formatDate(pass.endDate)}
                </div>
              </div>

              <div className="pt-2 border-t border-workspace-border/60 flex items-center justify-between">
                {hasQueued ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Renewal Queued
                  </span>
                ) : (
                  <Link
                    to={ROUTES.PASSES}
                    className="text-xs font-bold text-emerald-accent hover:text-emerald-dark inline-flex items-center gap-1 ml-auto"
                  >
                    Renew <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SecondaryPassGrid;
