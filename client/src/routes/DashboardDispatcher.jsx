import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { USER_ROLES } from '../utils/constants.js';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../layouts/MemberLayout.jsx';
import { AdminDashboardShell } from '../pages/admin/AdminDashboardShell.jsx';
import { TrainerDashboardShell } from '../pages/trainer/TrainerDashboardShell.jsx';
import { MemberDashboardShell } from '../pages/member/MemberDashboardShell.jsx';

/**
 * Role-aware Dashboard Dispatcher.
 * Resolves the authenticated user's role and renders their role-specific layout
 * and dashboard component directly under the common `/dashboard` URL.
 *
 * Does not redirect to `/admin/dashboard`, preserving a single flat URL hierarchy.
 *
 * @returns {JSX.Element}
 */
export function DashboardDispatcher() {
  const { role } = useAuth();

  switch (role) {
    case USER_ROLES.ADMIN:
      return (
        <AdminLayout>
          <AdminDashboardShell />
        </AdminLayout>
      );
    case USER_ROLES.TRAINER:
      return (
        <TrainerLayout>
          <TrainerDashboardShell />
        </TrainerLayout>
      );
    case USER_ROLES.MEMBER:
    default:
      return (
        <MemberLayout>
          <MemberDashboardShell />
        </MemberLayout>
      );
  }
}

export default DashboardDispatcher;
