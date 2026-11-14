import React, { Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { USER_ROLES } from '../utils/constants.js';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../layouts/MemberLayout.jsx';
import { RouteLoadingSpinner } from '../components/ui/RouteLoadingSpinner.jsx';

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'));
const TrainerDashboard = lazy(() => import('../pages/trainer/TrainerDashboard.jsx'));
const MemberDashboard = lazy(() => import('../pages/member/MemberDashboard.jsx'));

/**
 * Role-aware Dashboard Dispatcher.
 * Resolves the authenticated user's role and asynchronously renders their role-specific
 * layout and dashboard component directly under the common `/dashboard` URL.
 *
 * @returns {JSX.Element}
 */
export function DashboardDispatcher() {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        );
      case USER_ROLES.TRAINER:
        return (
          <TrainerLayout>
            <TrainerDashboard />
          </TrainerLayout>
        );
      case USER_ROLES.MEMBER:
      default:
        return (
          <MemberLayout>
            <MemberDashboard />
          </MemberLayout>
        );
    }
  };

  return (
    <Suspense fallback={<RouteLoadingSpinner fullScreen />}>
      {renderContent()}
    </Suspense>
  );
}

export default DashboardDispatcher;
