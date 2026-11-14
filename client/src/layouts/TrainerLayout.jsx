import React, { useState, useRef } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";
import { cn } from "../utils/cn.js";
import { PwaInstallButton } from "../components/pwa/PwaInstallButton.jsx";
import { ErrorBoundary } from "../components/ui/ErrorBoundary.jsx";

/**
 * Trainer sidebar navigation link configuration.
 */
const TRAINER_NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.CLIENTS, icon: Users, label: "Clients" },
  { to: ROUTES.WORKOUTS, icon: ClipboardList, label: "Workouts" },
  { to: ROUTES.SCHEDULE, icon: CalendarDays, label: "Schedule" },
];

/**
 * Trainer layout shell with sidebar navigation, top header, and content outlet.
 *
 * @returns {JSX.Element}
 */
export function TrainerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  /**
   * Closes mobile drawer and restores keyboard focus to the menu button.
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  /**
   * Handles user logout and navigates to home.
   */
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  /**
   * Renders a single navigation link styled for the sidebar.
   *
   * @param {{ to: string, icon: React.ElementType, label: string }} item
   * @returns {JSX.Element}
   */
  const renderNavItem = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === ROUTES.DASHBOARD}
        onClick={() => {
          if (mobileMenuOpen) closeMobileMenu();
        }}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
            isActive
              ? "bg-emerald-accent/10 text-emerald-accent border-l-2 border-emerald-accent -ml-px"
              : "text-text-muted hover:text-text-inverted hover:bg-brand-surface",
          )
        }
      >
        <Icon className="w-4.5 h-4.5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-workspace flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-brand-dark border-r border-brand-border sticky top-0 h-screen">
        <div className="h-16 flex items-center px-4 border-b border-brand-border">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-emerald-accent" />
            <span className="text-lg font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TRAINER_NAV_ITEMS.map(renderNavItem)}
        </nav>

        <div className="p-3 border-t border-brand-border space-y-1">
          <NavLink
            to={ROUTES.PROFILE}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-accent/10 text-emerald-accent"
                  : "text-text-muted hover:text-text-inverted hover:bg-brand-surface",
              )
            }
          >
            <User className="w-4.5 h-4.5" />
            <span>Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-status-danger hover:bg-status-danger/10 transition-colors w-full text-left"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        id="trainer-mobile-drawer"
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen ? "" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark border-r border-brand-border flex flex-col transform transition-all duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0 visible" : "-translate-x-full invisible",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-border">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5"
            onClick={closeMobileMenu}
          >
            <Dumbbell className="w-5 h-5 text-emerald-accent" />
            <span className="text-lg font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>
          <button
            onClick={closeMobileMenu}
            className="text-text-muted hover:text-text-inverted p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TRAINER_NAV_ITEMS.map(renderNavItem)}
        </nav>
        <div className="p-3 border-t border-brand-border space-y-1">
          <NavLink
            to={ROUTES.PROFILE}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-accent/10 text-emerald-accent"
                  : "text-text-muted hover:text-text-inverted hover:bg-brand-surface",
              )
            }
          >
            <User className="w-4.5 h-4.5" />
            <span>Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-status-danger hover:bg-status-danger/10 transition-colors w-full text-left"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-workspace-card border-b border-workspace-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-accent"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="trainer-mobile-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Trainer Workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <PwaInstallButton />
            <div className="w-8 h-8 rounded-full bg-brand-dark text-emerald-accent flex items-center justify-center font-bold text-xs">
              {user?.firstName?.[0] || "T"}
            </div>
            <span className="hidden sm:block text-sm font-medium text-text-primary">
              {user?.firstName || "Trainer"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ErrorBoundary variant="content" key={location.pathname}>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default TrainerLayout;
