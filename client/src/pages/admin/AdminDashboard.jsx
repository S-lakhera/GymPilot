import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useDashboard } from "../../hooks/useDashboard.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { USER_ROLES, ROUTES } from "../../utils/constants.js";
import {
  Shield,
  CreditCard,
  Users,
  Activity,
  RotateCcw,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard } from "../../components/dashboard/StatCard.jsx";
import { CategoryDistributionChart } from "../../components/dashboard/CategoryDistributionChart.jsx";
import { FinancialComparativeChart } from "../../components/dashboard/FinancialComparativeChart.jsx";
import { SystemMaintenanceCard } from "../../components/dashboard/SystemMaintenanceCard.jsx";
import { AdminRecentTransactionsTable } from "../../components/dashboard/AdminRecentTransactionsTable.jsx";
import { RecentMembersTable } from "../../components/dashboard/RecentMembersTable.jsx";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.jsx";

/**
 * Admin Executive Dashboard.
 * Displays financial metrics, membership distributions, recent audit feeds,
 * and explicit lifecycle maintenance.
 *
 * @returns {JSX.Element}
 */
export function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, refresh } = useDashboard(USER_ROLES.ADMIN);

  if (isLoading) {
    return <DashboardSkeleton role="admin" />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-status-danger mx-auto flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Failed to load admin metrics</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          {error.message || "An unexpected error occurred while fetching dashboard data."}
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

  const { membership, subscriptions, financials, categoryDistribution, recentTransactions, recentMembers } =
    data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Executive Management Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
            Welcome back, {user?.firstName || "Admin"}
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            System overview and gym operational status • {formatDate(new Date())}
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

          <Link
            to={ROUTES.MEMBERS}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1"
          >
            Members <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Revenue (All-Time)"
          value={formatCurrency(financials?.netRevenue || 0)}
          subtitle={`MTD: ${formatCurrency(financials?.netRevenueMtd || 0)} | Today: ${formatCurrency(
            financials?.netRevenueToday || 0
          )}`}
          icon={TrendingUp}
          badge={
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-status-success">
              Net Total
            </span>
          }
        />

        <StatCard
          title="Gross Collections"
          value={formatCurrency(financials?.grossRevenue || 0)}
          subtitle={`MTD: ${formatCurrency(financials?.grossRevenueMtd || 0)} • ${
            financials?.pendingPayments || 0
          } pending`}
          icon={CreditCard}
        />

        <StatCard
          title="Completed Refunds"
          value={formatCurrency(financials?.totalRefunded || 0)}
          subtitle={`MTD: ${formatCurrency(financials?.refundedMtd || 0)} refunded`}
          icon={RotateCcw}
        />

        <StatCard
          title="Active Members"
          value={membership?.activeMembers || 0}
          subtitle={`Total Roster: ${membership?.totalMembers || 0} • Trainers: ${
            membership?.activeTrainers || 0
          }`}
          icon={Users}
        />
      </div>

      {/* Subscription Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-workspace-card border border-workspace-border shadow-sm">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Active Passes
          </div>
          <div className="text-xl font-bold text-status-success mt-1">
            {subscriptions?.activeSubscriptions || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-workspace-card border border-workspace-border shadow-sm">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Queued Renewals
          </div>
          <div className="text-xl font-bold text-sky-600 mt-1">
            {subscriptions?.queuedSubscriptions || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-workspace-card border border-workspace-border shadow-sm">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Expiring Soon (≤7d)
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {subscriptions?.expiringSoon || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-workspace-card border border-workspace-border shadow-sm">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Expired Passes
          </div>
          <div className="text-xl font-bold text-slate-500 mt-1">
            {subscriptions?.expiredSubscriptions || 0}
          </div>
        </div>
      </div>

      {/* Data Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialComparativeChart financials={financials} />
        <CategoryDistributionChart categories={categoryDistribution} />
      </div>

      {/* System Operations & Subscription Maintenance */}
      <SystemMaintenanceCard onSyncSuccess={() => refresh()} />

      {/* Live Audit Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRecentTransactionsTable transactions={recentTransactions} />
        <RecentMembersTable members={recentMembers} />
      </div>
    </div>
  );
}

export default AdminDashboard;
