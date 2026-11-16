import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { USER_ROLES } from '../../utils/constants.js';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../../layouts/MemberLayout.jsx';
import { RouteLoadingSpinner } from '../../components/ui/RouteLoadingSpinner.jsx';

const AdminCoachingPage = lazy(() => import('./AdminCoachingPage.jsx'));
const TrainerCoachingPage = lazy(() => import('./TrainerCoachingPage.jsx'));
const MemberCoachingPage = lazy(() => import('./MemberCoachingPage.jsx'));

/**
 * Role-aware Coaching Dispatcher.
 * Renders the appropriate role-specific layout and workspace for `/coaching`.
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
        return (
          <MemberLayout>
            <MemberCoachingPage />
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

export default CoachingDispatcher;

