import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Shield,
  Sparkles,
  Activity,
  CheckCircle2,
  ArrowRight,
  Flame,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../utils/constants.js';
import { planApi } from '../api/planApi.js';
import { axiosClient } from '../api/axiosClient.js';
import { formatCurrency } from '../utils/formatters.js';

/**
 * Pre-configured static plans rendered immediately on landing to eliminate
 * any delay or skeleton waiting while cloud backend instances warm up.
 * Synchronized with live database once the backend responds.
 */
const STATIC_FEATURED_PLANS = [
  {
    id: 1,
    name: 'Strength Monthly Pass',
    category_name: 'Strength Training',
    description: '30-day full access to free weights, racks, and resistance machines.',
    duration_days: 30,
    price: 899.0,
    is_active: 1,
  },
  {
    id: 2,
    name: 'Strength Quarterly Pass',
    category_name: 'Strength Training',
    description: '90-day comprehensive strength training with discounted quarterly rate.',
    duration_days: 90,
    price: 2299.0,
    is_active: 1,
  },
  {
    id: 8,
    name: 'CrossFit Quarterly Warrior',
    category_name: 'CrossFit & Functional',
    description: '90-day intense functional fitness, rigs, and high-intensity workout circuits.',
    duration_days: 90,
    price: 2499.0,
    is_active: 1,
  },
];

/**
 * Public Landing Page.
 * Showcases GymPilot branding, core features, featured subscription plans, and entry CTAs.
 * Triggers non-blocking background server warm-up to mitigate free-tier cold starts.
 *
 * @returns {JSX.Element}
 */
export function PublicLandingPage() {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();

  // Instant render with static featured plans (0ms delay)
  const [featuredPlans, setFeaturedPlans] = useState(STATIC_FEATURED_PLANS);

  useEffect(() => {
    let isMounted = true;

    // 1. Proactive background server warm-up ping (non-blocking)
    axiosClient.get('/health', { timeout: 60000 }).catch(() => {});

    // 2. Verify and sync with live database once server is ready
    planApi
      .listPlans({ isActive: true })
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Sync with the latest active plans from the database
          setFeaturedPlans(data.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback to preloaded static data remains active seamlessly
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPlan = (plan) => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
      return;
    }
    navigate(ROUTES.REGISTER, {
      state: { from: ROUTES.PLANS, selectedPlanId: plan.id },
    });
  };

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

      {/* Featured & Popular Plans Section */}
      <section className="space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-accent text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" /> Popular Memberships
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
            Flexible Passes for Every Fitness Goal
          </h2>
          <p className="text-sm text-text-secondary">
            Multi-discipline workout tiers with zero hidden fees. Pick your tier or explore all passes.
          </p>
        </div>

        {/* Plan Cards Grid (Rendered instantly from static config, synced live from backend) */}
        {featuredPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPlans.map((plan, idx) => {
              const badges = [
                { label: '🔥 Best-Selling', bg: 'bg-emerald-500/10 text-emerald-accent border-emerald-500/30' },
                { label: '⭐ Most Popular', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
                { label: '✨ Best Value', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
              ];
              const badge = badges[idx % badges.length];

              return (
                <div
                  key={plan.id}
                  className="gym-card p-6 flex flex-col justify-between space-y-6 border border-brand-border/60 hover:border-emerald-accent/40 transition-all duration-200 relative group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-medium text-text-secondary flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {plan.duration_days || plan.durationDays} Days
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-display text-text-primary group-hover:text-emerald-accent transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {plan.description || 'Full floor access with complimentary locker and coach guidance.'}
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-display text-text-primary">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-text-secondary">/ pass</span>
                      </div>
                    </div>

                    <ul className="text-xs text-text-secondary space-y-2 pt-2 border-t border-workspace-border">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-accent flex-shrink-0" />
                        <span>{plan.category_name || plan.categoryName || 'Multi-Discipline'} access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-accent flex-shrink-0" />
                        <span>Full gym equipment & recovery zone</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-accent flex-shrink-0" />
                        <span>Instant digital pass on mobile</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>{isAuthenticated ? 'Select Plan' : 'Join Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Explore All Plans CTA */}
        <div className="text-center pt-2">
          <Link
            to={ROUTES.PLANS}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-surface border border-brand-border text-sm font-semibold text-text-inverted hover:bg-brand-muted hover:border-emerald-accent/40 transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-emerald-accent" />
            <span>Explore All Plans & Disciplines</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default PublicLandingPage;

