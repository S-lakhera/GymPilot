import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Route guard that restricts access to specific user roles.
 * If the authenticated user's role is not in `allowedRoles`, they are redirected
 * to /dashboard with a warning toast notification.
 *
 * This component assumes it is nested inside a ProtectedRoute (authentication is already verified).
 *
 * @param {{ allowedRoles: string[] }} props
 * @returns {JSX.Element}
 */
export function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();
  const { showToast } = useToast();

  const isAllowed = allowedRoles.includes(role);

  useEffect(() => {
    if (!isAllowed) {
      showToast({
        type: 'warning',
        message: 'Access denied: You do not have permission to view that page.',
      });
    }
  }, [isAllowed, showToast]);

  if (!isAllowed) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;

