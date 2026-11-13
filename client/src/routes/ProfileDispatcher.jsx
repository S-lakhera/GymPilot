import React, { Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { USER_ROLES } from '../utils/constants.js';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../layouts/MemberLayout.jsx';
import { RouteLoadingSpinner } from '../components/ui/RouteLoadingSpinner.jsx';

const ProfilePage = lazy(() => import('../pages/ProfilePage.jsx'));

/**
 * Role-aware Profile Dispatcher.
 * Renders the shared `/profile` component wrapped in the user's active role layout
 * (AdminLayout, TrainerLayout, or MemberLayout).
 *
 * @returns {JSX.Element}
 */
export function ProfileDispatcher() {
  const { role } = useAuth();

  const renderContent = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <AdminLayout>
            <ProfilePage />
          </AdminLayout>
        );
      case USER_ROLES.TRAINER:
        return (
          <TrainerLayout>
            <ProfilePage />
          </TrainerLayout>
        );
      case USER_ROLES.MEMBER:
      default:
        return (
          <MemberLayout>
            <ProfilePage />
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

export default ProfileDispatcher;
