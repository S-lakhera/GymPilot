import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  Ticket,
  ClipboardList,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';
import { cn } from '../utils/cn.js';
import { PwaInstallButton } from '../components/pwa/PwaInstallButton.jsx';

/**
 * Member bottom tab navigation items for the mobile PWA bottom bar.
 */
const MEMBER_NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.PASSES, icon: Ticket, label: 'Passes' },
  { to: ROUTES.WORKOUTS, icon: ClipboardList, label: 'Workouts' },
  { to: ROUTES.PROFILE, icon: User, label: 'Profile' },
];

/**
 * Member layout shell with hybrid navigation:
 * - Desktop: Clean sticky top header with nav links.
 * - Mobile / PWA: Fixed bottom tab bar with icon navigation.
 *
 * @returns {JSX.Element}
 */
export function MemberLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handles user logout and navigates to home.
   */
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-workspace flex flex-col font-sans">
      {/* Desktop Top Header */}
      <header className="hidden sm:block bg-brand-dark border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center group-hover:border-emerald-accent/40 transition-colors">
              <Dumbbell className="w-4.5 h-4.5 text-emerald-accent" />
            </div>
            <span className="text-lg font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-1">
            {MEMBER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ROUTES.DASHBOARD}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-accent/10 text-emerald-accent'
                        : 'text-text-muted hover:text-text-inverted hover:bg-brand-surface'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <PwaInstallButton className="mr-2" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-status-danger hover:bg-status-danger/10 transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Top Bar (brand + avatar only) */}
      <header className="sm:hidden bg-brand-dark border-b border-brand-border sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <Dumbbell className="w-4.5 h-4.5 text-emerald-accent" />
            <span className="text-base font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <PwaInstallButton compact />
            <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-emerald-accent font-bold text-xs">
              {user?.firstName?.[0] || 'M'}
            </div>
            <button
              onClick={handleLogout}
              className="text-status-danger hover:bg-status-danger/10 p-1.5 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-6">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Tab Bar (PWA) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-workspace-card border-t border-workspace-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {MEMBER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                    isActive ? 'text-emerald-accent' : 'text-text-secondary'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default MemberLayout;

