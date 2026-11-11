import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Public layout shell for unauthenticated pages (Landing, Plans, Trainers directory).
 * Renders a branded dark header with role-aware action buttons and a public footer.
 *
 * @returns {JSX.Element}
 */
export function PublicLayout() {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-workspace text-text-primary flex flex-col font-sans">
      {/* Public Header */}
      <header className="bg-brand-dark border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-md group-hover:border-emerald-accent/40 transition-colors">
              <Dumbbell className="w-5 h-5 text-emerald-accent" />
            </div>
            <span className="text-xl font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>

          {/* Navigation Actions */}
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Dashboard
                </button>
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-emerald-accent font-bold text-xs">
                    {user?.firstName?.[0] || '?'}
                  </div>
                  <span className="text-xs text-text-muted capitalize">{role}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="btn-secondary text-xs py-2 px-3 border-brand-border text-text-muted hover:text-text-inverted hover:bg-brand-surface"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-primary text-xs py-2 px-3 hidden sm:inline-flex"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-brand-dark border-t border-brand-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-accent" />
              <span className="text-sm font-bold font-display text-text-inverted">
                GYM<span className="text-emerald-accent">PILOT</span>
              </span>
            </div>
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} GymPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;

