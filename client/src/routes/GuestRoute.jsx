import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { SplashLoader } from "../components/common/SplashLoader.jsx";
import { ROUTES } from "../utils/constants.js";

/**
 * Route guard for guest-only pages (Login, Register).
 * While session restoration is in-flight, renders the SplashLoader.
 * If already authenticated, redirects to the originally attempted URL (state.from) or /dashboard.
 * If not authenticated, renders the authentication page.
 *
 * @returns {JSX.Element}
 */
export function GuestRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return <SplashLoader message="Checking session..." />;
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
