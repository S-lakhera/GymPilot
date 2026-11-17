import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { USER_ROLES, ROUTES } from '../../utils/constants.js';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../../layouts/TrainerLayout.jsx';
import { RouteLoadingSpinner } from '../../components/ui/RouteLoadingSpinner.jsx';

const AdminCoachingPage = lazy(() => import('./AdminCoachingPage.jsx'));
const TrainerCoachingPage = lazy(() => import('./TrainerCoachingPage.jsx'));

/**
 * Role-aware Coaching Dispatcher.
 * Renders the appropriate role-specific layout and workspace for `/coaching`.
 * Members are redirected to `/workouts` where their personal coach and workout routines are unified.
 *
 * @returns {JSX.Element}
 */
export function CoachingDispatcher() {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <AdminLayout>
            <AdminCoachingPage />
          </AdminLayout>
        );
      case USER_ROLES.TRAINER:
        return (
          <TrainerLayout>
            <TrainerCoachingPage />
          </TrainerLayout>
        );
      case USER_ROLES.MEMBER:
      default:
        return <Navigate to={ROUTES.WORKOUTS} replace />;
    }
  };

  return (
    <Suspense fallback={<RouteLoadingSpinner fullScreen />}>
      {renderContent()}
    </Suspense>
  );
}

export default CoachingDispatcher;

