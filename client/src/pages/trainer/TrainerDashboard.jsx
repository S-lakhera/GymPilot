import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useDashboard } from "../../hooks/useDashboard.js";
import { USER_ROLES, ROUTES } from "../../utils/constants.js";
import { Dumbbell, RefreshCw, Loader2, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { CoachProfileCard } from "../../components/dashboard/CoachProfileCard.jsx";
import { Phase6RoadmapCard } from "../../components/dashboard/Phase6RoadmapCard.jsx";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.jsx";
import { StatusBadge } from "../../components/dashboard/StatusBadge.jsx";

/**
 * Trainer Coaching Workspace Dashboard.
 * Displays coach qualifications, account status, and Phase 6 module roadmaps.
 *
 * @returns {JSX.Element}
 */
export function TrainerDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, refresh } = useDashboard(USER_ROLES.TRAINER);

  if (isLoading) {
    return <DashboardSkeleton role="trainer" />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-status-danger mx-auto flex items-center justify-center">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Failed to load coach workspace</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          {error.message || "An unexpected error occurred while fetching trainer metrics."}
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

  const { profile } = data || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5" />
              Coach Workspace
            </span>
            <StatusBadge status={profile?.is_active ?? user?.isActive} type="account" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
            Hello, Coach {user?.firstName || "Trainer"}
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            Personal profile, qualifications, and Phase 6 client assignment workspace.
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

      {/* Coach Profile & Qualifications */}
      <CoachProfileCard profile={profile} />

      {/* Phase 6 Modules Roadmap Stubs */}
      <Phase6RoadmapCard />
    </div>
  );
}

export default TrainerDashboard;

