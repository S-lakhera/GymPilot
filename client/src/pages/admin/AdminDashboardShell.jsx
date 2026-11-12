import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Shield, Users, CreditCard, Activity, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants.js';

/**
 * Admin Dashboard Shell.
 * Renders executive metrics placeholders and links to management modules.
 *
 * @returns {JSX.Element}
 */
export function AdminDashboardShell() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Administrator Executive View
          </div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            Welcome back, {user?.firstName || 'Admin'}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            System overview and gym operational status.
          </p>
        </div>

        <Link
          to={ROUTES.MEMBERS}
          className="btn-primary text-xs py-2 px-4 self-start sm:self-auto"
        >
          Manage Members <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* KPI Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Active Roster</div>
          <p className="text-xs text-text-secondary">Connected to /api/dashboard/admin</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Net Revenue</span>
            <CreditCard className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Ledger Summary</div>
          <p className="text-xs text-text-secondary">Gross collections minus refunds</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Active Passes</span>
            <Activity className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Subscribed</div>
          <p className="text-xs text-text-secondary">Self-healing status metrics</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Role Verified</span>
            <Shield className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-status-success capitalize">{user?.role}</div>
          <p className="text-xs text-text-secondary">Full access permissions</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardShell;

