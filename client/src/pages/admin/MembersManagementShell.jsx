import React from 'react';
import { Users, Shield, Search, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Admin Member Management Shell (Milestone 5.3 Route Probe).
 * Verifies role-based authorization restricting `/members` exclusively to ADMIN.
 *
 * @returns {JSX.Element}
 */
export function MembersManagementShell() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            Admin Restricted Route
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">Member Directory</h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage gym members, membership statuses, and profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-workspace-card border border-workspace-border text-text-secondary font-medium">
            Active Role: <strong className="text-emerald-dark uppercase">{user?.role}</strong>
          </span>
        </div>
      </div>

      <div className="gym-card space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-workspace border border-workspace-border">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            disabled
            placeholder="Search members by name, email, or phone (Active in Phase 5.6)..."
            className="bg-transparent border-0 text-xs text-text-primary w-full p-0 focus:ring-0"
          />
        </div>

        <div className="p-8 text-center space-y-2 border border-dashed border-workspace-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-accent/10 text-emerald-accent flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">Admin Guard Verified</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            This route is successfully protected by RoleRoute(allowedRoles=['admin']). Full paginated member ledger will be connected in Milestone 5.6.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MembersManagementShell;

