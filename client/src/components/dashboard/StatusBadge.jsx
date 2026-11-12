import React from "react";
import { cn } from "../../utils/cn.js";
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from "../../utils/constants.js";

/**
 * Standardized status pill badge across GymPilot dashboards.
 * Applies accessible semantic styling across payments, subscriptions, and accounts.
 *
 * @param {{
 *   status: string|boolean,
 *   type?: 'subscription'|'payment'|'account',
 *   className?: string
 * }} props
 */
export function StatusBadge({ status, type = "subscription", className }) {
  let label = String(status || "").toUpperCase();
  let badgeClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (type === "account" || typeof status === "boolean") {
    const isActive = Boolean(status);
    label = isActive ? "Active Account" : "Inactive Account";
    badgeClasses = isActive
      ? "bg-emerald-50 text-status-success border-emerald-200"
      : "bg-slate-100 text-text-secondary border-slate-200";
  } else if (type === "payment") {
    switch (String(status).toUpperCase()) {
      case PAYMENT_STATUS.COMPLETED:
        label = "Completed";
        badgeClasses = "bg-emerald-50 text-status-success border-emerald-200";
        break;
      case PAYMENT_STATUS.PENDING:
        label = "Pending";
        badgeClasses = "bg-amber-50 text-amber-600 border-amber-200";
        break;
      case PAYMENT_STATUS.PARTIALLY_REFUNDED:
        label = "Partially Refunded";
        badgeClasses = "bg-purple-50 text-purple-600 border-purple-200";
        break;
      case PAYMENT_STATUS.REFUNDED:
        label = "Refunded";
        badgeClasses = "bg-slate-100 text-slate-600 border-slate-300";
        break;
      case PAYMENT_STATUS.FAILED:
      default:
        label = "Failed";
        badgeClasses = "bg-rose-50 text-status-danger border-rose-200";
        break;
    }
  } else {
    // Subscription status
    switch (String(status).toLowerCase()) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        label = "Active";
        badgeClasses = "bg-emerald-50 text-status-success border-emerald-200";
        break;
      case SUBSCRIPTION_STATUS.QUEUED:
        label = "Queued Renewal";
        badgeClasses = "bg-sky-50 text-sky-600 border-sky-200";
        break;
      case SUBSCRIPTION_STATUS.EXPIRED:
        label = "Expired";
        badgeClasses = "bg-slate-100 text-slate-600 border-slate-200";
        break;
      case SUBSCRIPTION_STATUS.PENDING_PAYMENT:
        label = "Pending Payment";
        badgeClasses = "bg-amber-50 text-amber-600 border-amber-200";
        break;
      case SUBSCRIPTION_STATUS.CANCELLED:
      default:
        label = "Cancelled";
        badgeClasses = "bg-rose-50 text-status-danger border-rose-200";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        badgeClasses,
        className
      )}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
