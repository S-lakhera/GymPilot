import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Shield, Sparkles, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Public Landing Page.
 * Showcases GymPilot branding, core features, and entry CTAs.
 * Continues to be accessible to authenticated users via the Logo/Home link.
 *
 * @returns {JSX.Element}
 */
export function PublicLandingPage() {
  const { isAuthenticated, user, role } = useAuth();

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="bg-brand-dark text-text-inverted rounded-3xl p-8 sm:p-14 border border-brand-border shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-accent/10 border border-emerald-accent/30 text-emerald-accent text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Athletic Management
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
            Elevate Your Gym Experience with <span className="text-emerald-accent">GymPilot</span>
          </h1>

          <p className="text-text-muted text-base sm:text-lg leading-relaxed">
            Role-tailored interfaces for administrators, coaches, and members. Seamless pass management, automated subscription tracking, and instant mobile check-ins.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD} className="btn-primary py-3 px-6 text-sm">
                Open {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Dashboard{' '}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER} className="btn-primary py-3 px-6 text-sm">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="btn-secondary py-3 px-6 text-sm bg-brand-surface border-brand-border text-text-inverted hover:bg-brand-muted"
                >
                  Member Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-emerald-accent/10 blur-3xl pointer-events-none" />
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
            Unified System, Specialized Workspaces
          </h2>
          <p className="text-sm text-text-secondary">
            Built from the ground up for gym owners, personal trainers, and active members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gym-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-accent/10 flex items-center justify-center text-emerald-accent">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Executive Administration</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Real-time revenue ledgers, member status toggles, trainer allocations, and discount coupon management.
            </p>
            <ul className="text-xs text-text-secondary space-y-1.5 pt-2 border-t border-workspace-border">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> Revenue & refund tracking
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> Self-healing subscription sync
              </li>
            </ul>
          </div>

          <div className="gym-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-accent/10 flex items-center justify-center text-emerald-accent">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Trainer Coaching Hub</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Assigned client rosters, personal training schedules, and workout plan distribution.
            </p>
            <ul className="text-xs text-text-secondary space-y-1.5 pt-2 border-t border-workspace-border">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> Daily schedule overview
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> Client attendance logs
              </li>
            </ul>
          </div>

          <div className="gym-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-accent/10 flex items-center justify-center text-emerald-accent">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Member Mobile PWA</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mobile bottom-tab navigation for quick check-ins, active gym passes, and automatic session restoration.
            </p>
            <ul className="text-xs text-text-secondary space-y-1.5 pt-2 border-t border-workspace-border">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> Instant pass verification
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-accent" /> 7-day silent refresh session
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicLandingPage;

