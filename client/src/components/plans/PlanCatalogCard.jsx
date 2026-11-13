import React from "react";
import { Check, Calendar, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Membership Plan Catalog Card with category-aware pass status and Join/Renew CTAs.
 *
 * @param {{
 *   plan: Object,
 *   memberActivePasses?: Array<Object>,
 *   onSelectPlan: (plan: Object) => void,
 *   isAuthenticated?: boolean,
 *   role?: string
 * }} props
 */
export function PlanCatalogCard({
  plan,
  memberActivePasses = [],
  onSelectPlan,
  isAuthenticated = false,
  role = "member",
}) {
  const categoryId = plan.category_id || plan.categoryId;

  // Detect category subscription state
  const activePass = memberActivePasses.find(
    (p) =>
      (p.category_id === categoryId || p.categoryId === categoryId) &&
      p.status === "active"
  );
  const queuedPass = memberActivePasses.find(
    (p) =>
      (p.category_id === categoryId || p.categoryId === categoryId) &&
      p.status === "queued"
  );

  const isRenewalQueued = Boolean(queuedPass);
  const hasActivePass = Boolean(activePass);

  const getCtaLabel = () => {
    if (!isAuthenticated) return "Join Now";
    if (isRenewalQueued) return "Renewal Queued";
    if (hasActivePass) return "Renew Pass";
    return "Join Plan";
  };

  const getActionBadge = () => {
    if (isRenewalQueued) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          Renewal Scheduled
        </span>
      );
    }
    if (hasActivePass) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" /> Current Active Category
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-workspace-card rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 shadow-sm hover:shadow-md relative ${
        hasActivePass
          ? "border-emerald-accent/60 ring-1 ring-emerald-accent/30"
          : "border-workspace-border hover:border-slate-300"
      }`}
    >
      <div>
        {/* Category & Status Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {plan.category_name || plan.categoryName || "Workout Plan"}
          </span>
          {getActionBadge()}
        </div>

        {/* Plan Title & Duration */}
        <h3 className="text-xl font-bold font-display text-text-primary mb-1">
          {plan.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
          <Calendar className="w-3.5 h-3.5 text-emerald-accent" />
          <span>{plan.duration_days || plan.durationDays} Days Pass</span>
        </div>

        {/* Pricing */}
        <div className="mb-5 pb-5 border-b border-workspace-border">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-display text-text-primary tracking-tight">
              {formatCurrency(plan.price)}
            </span>
            <span className="text-xs text-text-muted">
              / {plan.duration_days || plan.durationDays} days
            </span>
          </div>
        </div>

        {/* Plan Description & Features */}
        <div className="space-y-2.5 mb-6 text-xs text-text-secondary">
          {plan.description ? (
            <p className="line-clamp-2 text-text-secondary mb-3">{plan.description}</p>
          ) : (
            <p className="text-text-muted mb-3">
              Full facility and workout floor access in the {plan.category_name || "selected"} category.
            </p>
          )}

          <div className="space-y-2 text-text-primary">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Unlimited category workout zone access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Locker and shower facility included</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Complimentary coach induction assessment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isRenewalQueued}
          onClick={() => onSelectPlan(plan)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
            isRenewalQueued
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : hasActivePass
              ? "bg-emerald-accent text-slate-900 hover:bg-emerald-dark hover:text-white"
              : "btn-primary"
          }`}
        >
          {getCtaLabel()} {!isRenewalQueued && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default PlanCatalogCard;

