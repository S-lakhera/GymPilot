import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { SplashLoader } from '../components/common/SplashLoader.jsx';
import { ROUTES } from '../utils/constants.js';

/**
 * PWA start URL entry point (/app).
 * Waits for silent session restoration to complete, then:
 * - Valid session: navigates to /dashboard.
 * - No session: navigates to /login.
 *
 * This component never renders visible content beyond the SplashLoader.
 *
 * @returns {JSX.Element}
 */
export function PwaGateway() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <SplashLoader message="Launching GymPilot..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Navigate to={ROUTES.LOGIN} replace />;
}

export default PwaGateway;
