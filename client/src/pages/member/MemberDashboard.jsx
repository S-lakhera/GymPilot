import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useDashboard } from "../../hooks/useDashboard.js";
import { USER_ROLES, ROUTES } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { Sparkles, RefreshCw, Loader2, Ticket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroPassCard } from "../../components/dashboard/HeroPassCard.jsx";
import { SecondaryPassGrid } from "../../components/dashboard/SecondaryPassGrid.jsx";
import { QueuedRenewalsCard } from "../../components/dashboard/QueuedRenewalsCard.jsx";
import { ProfileCompletenessBanner } from "../../components/dashboard/ProfileCompletenessBanner.jsx";
import { MemberPaymentReceiptsTable } from "../../components/dashboard/MemberPaymentReceiptsTable.jsx";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.jsx";

/**
 * Member Portal Dashboard.
 * Supports multiple concurrent active passes, priority nearest-expiration highlight,
 * category-linked queued renewals, profile completeness alerts, and personal payment receipts.
 *
 * @returns {JSX.Element}
 */
export function MemberDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, refresh } = useDashboard(USER_ROLES.MEMBER);

  if (isLoading) {
    return <DashboardSkeleton role="member" />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-status-danger mx-auto flex items-center justify-center">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Failed to load member portal</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          {error.message || "An unexpected error occurred while fetching your membership details."}
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const { activePasses = [], queuedRenewals = [], nearestExpiration, recentPayments = [], profileCompleteness } =
    data || {};

  // Resolve primary pass (nearest-expiring active pass) and secondary active passes
  const primaryPass =
    activePasses.find((p) => p.subscriptionId === nearestExpiration?.subscriptionId) ||
    activePasses[0] ||
    null;

  const secondaryPasses = activePasses.filter(
    (p) => p.subscriptionId !== primaryPass?.subscriptionId
  );

  const primaryHasQueued = queuedRenewals.some(
    (q) => q.categoryName === primaryPass?.categoryName
  );

  const primaryQueuedPass = queuedRenewals.find(
    (q) => q.categoryName === primaryPass?.categoryName
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Member Pass Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
            Welcome, {user?.firstName || "Member"}
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            Track your active gym passes, renewals, and billing records • {formatDate(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-inverted text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-brand-surface/80 transition-colors disabled:opacity-60"
            title="Refresh Data"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Completeness Action Banner (conditionally displayed if < 100%) */}
      <ProfileCompletenessBanner completeness={profileCompleteness} />

      {/* Active Passes Section */}
      {activePasses.length === 0 ? (
        <div className="bg-workspace-card border border-workspace-border rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-accent/10 text-emerald-accent mx-auto flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-text-primary">
              No Active Gym Passes
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              You do not have an active gym membership pass. Explore our membership plans to start training today.
            </p>
          </div>
          <Link
            to={ROUTES.PASSES}
            className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
          >
            Browse Plans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Featured Primary Pass (Nearest Expiration) */}
          <HeroPassCard
            pass={primaryPass}
            hasQueuedRenewal={primaryHasQueued}
            queuedRenewal={primaryQueuedPass}
          />

          {/* Secondary Concurrent Active Passes */}
          {secondaryPasses.length > 0 && (
            <SecondaryPassGrid
              passes={secondaryPasses}
              queuedRenewals={queuedRenewals}
            />
          )}
        </div>
      )}

      {/* Queued Upcoming Renewals */}
      <QueuedRenewalsCard queuedRenewals={queuedRenewals} />

      {/* Personal Payment Receipts Ledger */}
      <MemberPaymentReceiptsTable payments={recentPayments} />
    </div>
  );
}

export default MemberDashboard;
