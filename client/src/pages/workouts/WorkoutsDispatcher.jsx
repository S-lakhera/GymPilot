import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, USER_ROLES } from '../../utils/constants.js';
import { TrainerLayout } from '../../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../../layouts/MemberLayout.jsx';
import { RouteLoadingSpinner } from '../../components/ui/RouteLoadingSpinner.jsx';

const TrainerWorkoutsPage = lazy(() =>
  import('./TrainerWorkoutsPage.jsx').then((m) => ({
    default: m.default || m.TrainerWorkoutsPage,
  }))
);
const MemberWorkoutsPage = lazy(() =>
  import('./MemberWorkoutsPage.jsx').then((m) => ({
    default: m.default || m.MemberWorkoutsPage,
  }))
);

/**
 * Role-aware Workouts Dispatcher.
 * Resolves the authenticated user's role and renders their role-specific
 * workspace under the common `/workouts` URL:
 * - Trainer: TrainerLayout with TrainerWorkoutsPage (workout plan authoring desk)
 * - Member: MemberLayout with MemberWorkoutsPage (active routine & session checklist)
 * - Admin/Other: Redirects to /dashboard
 *
 * @returns {JSX.Element}
 */
export function WorkoutsDispatcher() {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case USER_ROLES.TRAINER:
        return (
          <TrainerLayout>
            <TrainerWorkoutsPage />
          </TrainerLayout>
        );
      case USER_ROLES.MEMBER:
        return (
          <MemberLayout>
            <MemberWorkoutsPage />
          </MemberLayout>
        );
      case USER_ROLES.ADMIN:
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

export default WorkoutsDispatcher;
