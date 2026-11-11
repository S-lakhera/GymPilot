import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  CreditCard,
  Tags,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';
import { cn } from '../utils/cn.js';

/**
 * Admin sidebar navigation link configuration.
 */
const ADMIN_NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.MEMBERS, icon: Users, label: 'Members' },
  { to: ROUTES.TRAINERS, icon: UserCog, label: 'Trainers' },
  { to: ROUTES.PLANS, icon: ClipboardList, label: 'Plans' },
  { to: ROUTES.PAYMENTS, icon: CreditCard, label: 'Payments' },
  { to: ROUTES.DISCOUNTS, icon: Tags, label: 'Discounts' },
  { to: ROUTES.REFUNDS, icon: ReceiptText, label: 'Refunds' },
];

/**
 * Admin layout shell with persistent sidebar navigation, top header, and content outlet.
 * Desktop: fixed sidebar with collapse toggle.
 * Mobile: off-canvas drawer toggled via hamburger icon.
 *
 * @returns {JSX.Element}
 */
export function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-emerald-accent/10 text-emerald-accent border-l-2 border-emerald-accent -ml-px'
              : 'text-text-muted hover:text-text-inverted hover:bg-brand-surface'
          )
        }
      >
        <Icon className="w-4.5 h-4.5 flex-shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-workspace flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-brand-dark border-r border-brand-border transition-all duration-200 sticky top-0 h-screen',
          sidebarCollapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-border">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-emerald-accent flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-lg font-bold font-display text-text-inverted tracking-tight">
                GYM<span className="text-emerald-accent">PILOT</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-text-muted hover:text-text-inverted transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map(renderNavItem)}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-brand-border space-y-1">
          <NavLink
            to={ROUTES.PROFILE}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-emerald-accent/10 text-emerald-accent'
                  : 'text-text-muted hover:text-text-inverted hover:bg-brand-surface'
              )
            }
          >
            <User className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Profile</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-status-danger hover:bg-status-danger/10 transition-colors duration-150 w-full text-left"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark border-r border-brand-border flex flex-col transform transition-transform duration-200 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-border">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <Dumbbell className="w-5 h-5 text-emerald-accent" />
            <span className="text-lg font-bold font-display text-text-inverted tracking-tight">
              GYM<span className="text-emerald-accent">PILOT</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-text-muted hover:text-text-inverted"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map(renderNavItem)}
        </nav>
        <div className="p-3 border-t border-brand-border space-y-1">
          <NavLink
            to={ROUTES.PROFILE}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-emerald-accent/10 text-emerald-accent' : 'text-text-muted hover:text-text-inverted hover:bg-brand-surface'
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
        {/* Top Header Bar */}
        <header className="h-16 bg-workspace-card border-b border-workspace-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-dark text-emerald-accent flex items-center justify-center font-bold text-xs">
              {user?.firstName?.[0] || 'A'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-text-primary">
              {user?.firstName || 'Admin'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

