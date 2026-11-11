import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';

/**
 * 404 Route Not Found Page.
 * Styled with GymPilot branding and provides quick recovery links to Home or Dashboard.
 *
 * @returns {JSX.Element}
 */
export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-workspace flex items-center justify-center p-4">
      <div className="gym-card max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-dark text-emerald-accent shadow-md mx-auto">
          <Dumbbell className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold font-display text-text-primary tracking-tight">404</span>
          <h1 className="text-xl font-bold text-text-primary">Page Not Found</h1>
          <p className="text-xs text-text-secondary">
            The page you requested could not be located or may have moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={ROUTES.HOME} className="btn-secondary w-full sm:w-auto text-xs py-2 px-4">
            <Home className="w-3.5 h-3.5 mr-1.5" /> Back to Home
          </Link>
          {isAuthenticated && (
            <Link to={ROUTES.DASHBOARD} className="btn-primary w-full sm:w-auto text-xs py-2 px-4">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
