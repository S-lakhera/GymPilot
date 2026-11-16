import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { USER_ROLES, ROUTES } from '../utils/constants.js';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../layouts/TrainerLayout.jsx';
import { RouteLoadingSpinner } from '../components/ui/RouteLoadingSpinner.jsx';

const AdminAttendancePage = lazy(() => import('../pages/admin/AdminAttendancePage.jsx'));
const TrainerAttendancePage = lazy(() => import('../pages/trainer/TrainerAttendancePage.jsx'));

/**
 * Role-aware Attendance Dispatcher.
 * Renders the appropriate role-specific layout and workspace for `/attendance`.
 *
 * @returns {JSX.Element}
 */
export function AttendanceDispatcher() {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <AdminLayout>
            <AdminAttendancePage />
          </AdminLayout>
        );
      case USER_ROLES.TRAINER:
        return (
          <TrainerLayout>
            <TrainerAttendancePage />
          </TrainerLayout>
        );
      case USER_ROLES.MEMBER:
      default:
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  };

  return (
    <Suspense fallback={<RouteLoadingSpinner fullScreen />}>
      {renderContent()}
    </Suspense>
  );
}

export default AttendanceDispatcher;
