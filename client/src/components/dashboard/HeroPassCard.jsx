import React from "react";
import { formatDate } from "../../utils/formatters.js";
import { Ticket, Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Hero Pass Card for Member Dashboard.
 * Highlights the primary, nearest-expiring active membership pass.
 *
 * @param {{
 *   pass: {
 *     subscriptionId: number,
 *     planName: string,
 *     categoryName: string,
 *     startDate: string,
 *     endDate: string,
 *     daysRemaining: number,
 *     status: string
 *   },
 *   hasQueuedRenewal?: boolean,
 *   queuedRenewal?: Object
 * }} props
 */
export function HeroPassCard({ pass, hasQueuedRenewal = false, queuedRenewal = null }) {
  if (!pass) return null;

  const isExpiringSoon = pass.daysRemaining <= 7;

  return (
    <div className="gym-dark-card relative overflow-hidden shadow-xl border border-brand-border">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-bold uppercase tracking-wider">
              <Ticket className="w-3.5 h-3.5" />
              Active Pass
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-text-muted text-xs font-medium">
              {pass.categoryName}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
              {pass.planName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-2">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-accent" />
                Valid: {formatDate(pass.startDate)} – {formatDate(pass.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Expiration & Renewal CTA Block */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-brand-border/60">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold ${
              isExpiringSoon
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {isExpiringSoon ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>
              {pass.daysRemaining} {pass.daysRemaining === 1 ? "Day" : "Days"} Left
              {isExpiringSoon && " — Expiring Soon!"}
            </span>
          </div>

          <div className="w-full sm:w-auto">
            {hasQueuedRenewal ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Renewal Scheduled ({formatDate(queuedRenewal?.startDate)})
                </span>
              </div>
            ) : (
              <Link
                to={ROUTES.PASSES}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                Renew Pass <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroPassCard;
