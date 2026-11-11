import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Ticket, Activity, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants.js';

/**
 * Member Dashboard Shell.
 * Renders member pass status, workout metrics, and quick renewal actions.
 *
 * @returns {JSX.Element}
 */
export function MemberDashboardShell() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Member Pass Portal
          </div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            Welcome, {user?.firstName || 'Member'}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Track your active gym passes, check-in history, and renewals.
          </p>
        </div>

        <Link
          to={ROUTES.PASSES}
          className="btn-primary text-xs py-2 px-4 self-start sm:self-auto"
        >
          View Active Passes <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Current Pass</span>
            <Ticket className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Gym Membership</div>
          <p className="text-xs text-text-secondary">Connected to /api/dashboard/member</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Check-in Streak</span>
            <Activity className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Active</div>
          <p className="text-xs text-text-secondary">Weekly attendance log</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Billing Status</span>
            <CreditCard className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-status-success">In Good Standing</div>
          <p className="text-xs text-text-secondary">Role: {user?.role}</p>
        </div>
      </div>
    </div>
  );
}

export default MemberDashboardShell;
