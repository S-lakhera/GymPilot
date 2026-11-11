import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { SplashLoader } from "../components/common/SplashLoader.jsx";
import { ROUTES } from "../utils/constants.js";

/**
 * Route guard for authenticated-only routes.
 * While session restoration is in-flight, renders the SplashLoader.
 * If not authenticated, redirects to /login preserving the attempted URL in `state.from`.
 * If authenticated, renders the child route outlet.
 *
 * @returns {JSX.Element}
 */
export function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return <SplashLoader message="Restoring GymPilot session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
