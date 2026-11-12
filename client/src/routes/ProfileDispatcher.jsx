import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { USER_ROLES } from '../utils/constants.js';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { TrainerLayout } from '../layouts/TrainerLayout.jsx';
import { MemberLayout } from '../layouts/MemberLayout.jsx';
import { ProfileShell } from '../pages/ProfileShell.jsx';

/**
 * Role-aware Profile Dispatcher.
 * Renders the shared `/profile` component wrapped in the user's active role layout
 * (AdminLayout, TrainerLayout, or MemberLayout).
 *
 * @returns {JSX.Element}
 */
export function ProfileDispatcher() {
  const { role } = useAuth();

  switch (role) {
    case USER_ROLES.ADMIN:
      return (
        <AdminLayout>
          <ProfileShell />
        </AdminLayout>
      );
    case USER_ROLES.TRAINER:
      return (
        <TrainerLayout>
          <ProfileShell />
        </TrainerLayout>
      );
    case USER_ROLES.MEMBER:
    default:
      return (
        <MemberLayout>
          <ProfileShell />
        </MemberLayout>
      );
  }
}

export default ProfileDispatcher;

