import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Search,
  Calendar,
  Users,
  Award,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { workoutApi } from '../../api/workoutApi.js';
import { coachingApi } from '../../api/coachingApi.js';
import { WorkoutPlanFormModal } from '../../components/workouts/WorkoutPlanFormModal.jsx';
import { useToast } from '../../hooks/useToast.js';

export function TrainerWorkoutsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const targetMemberId = searchParams.get('memberId');
  const { showToast } = useToast();

  const [plans, setPlans] = useState([]);
  const [assignedClients, setAssignedClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [initialMemberId, setInitialMemberId] = useState(null);

  // Load plans & assigned roster
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansData, rosterData] = await Promise.all([
        workoutApi.getTrainerPlans(),
        coachingApi.getTrainerRoster().catch(() => ({ assignments: [] })),
      ]);

      setPlans(plansData || []);

      const rawRoster = rosterData?.assignments || [];
      const mappedClients = rawRoster.map((c) => ({
        memberId: c.member_id || c.memberId,
        memberName: c.memberName || `${c.member_first_name || ''} ${c.member_last_name || ''}`.trim() || 'Gym Member',
      }));
      setAssignedClients(mappedClients);
    } catch (err) {
      setError(err.message || 'Failed to load workout library.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // If URL has ?memberId=..., handle automatic open
  useEffect(() => {
    if (!targetMemberId || isLoading || error) return;

    let isMounted = true;
    const resolveMember = async () => {
      const clientFromState = location.state?.client;
      const matchedClient =
        assignedClients.find((c) => String(c.memberId) === String(targetMemberId)) ||
        (clientFromState && String(clientFromState.memberId) === String(targetMemberId) ? clientFromState : null);

      if (matchedClient) {
        setInitialMemberId(matchedClient.memberId);
        const existing = plans.find((p) => String(p.memberId) === String(targetMemberId) && p.isActive);
        if (existing) {
          try {
            const fullPlan = await workoutApi.getPlanById(existing.id);
            if (isMounted) {
              if (!fullPlan) {
                showToast({ type: 'danger', message: 'Failed to load plan details.' });
              } else {
                setEditingPlan(fullPlan);
                setIsModalOpen(true);
              }
            }
          } catch (err) {
            if (isMounted) {
              showToast({ type: 'danger', message: err.message || 'Failed to load plan details.' });
            }
          }
        } else {
          if (isMounted) {
            setEditingPlan(null);
            setIsModalOpen(true);
          }
        }
      }

      if (isMounted) {
        setSearchParams({}, { replace: true });
      }
    };

    resolveMember();

    return () => {
      isMounted = false;
    };
  }, [targetMemberId, isLoading, error, assignedClients, plans, location.state, setSearchParams, showToast]);

  // Open Create Modal
  const handleOpenCreate = (preselectedMemberId = null) => {
    setEditingPlan(null);
    setInitialMemberId(preselectedMemberId);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (plan) => {
    try {
      const fullPlan = await workoutApi.getPlanById(plan.id);
      if (!fullPlan) {
        showToast({ type: 'danger', message: 'Failed to load plan details.' });
        return;
      }
      setEditingPlan(fullPlan);
      setInitialMemberId(plan.memberId);
      setIsModalOpen(true);
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to load plan details.' });
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId, planTitle) => {
    if (!window.confirm(`Are you sure you want to delete the workout plan "${planTitle}"?`)) {
      return;
    }
    try {
      await workoutApi.deletePlan(planId);
      showToast({ type: 'success', message: 'Workout plan deleted successfully.' });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to delete workout plan.' });
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.memberName?.toLowerCase().includes(q) ||
      p.goal?.toLowerCase().includes(q)
    );
  });

  const activePlansCount = plans.filter((p) => p.isActive).length;
  const uniqueAthletesWithPlan = new Set(plans.filter((p) => p.isActive).map((p) => p.memberId)).size;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Dumbbell className="w-4 h-4" />
            Trainer Coaching Workspace
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-inverted">
            Workout Library & Regimens
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Assemble multi-day split routines, target sets, and rep prescriptions for your assigned athletes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate()}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Workout Plan</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted">Total Authored Plans</p>
            <p className="text-2xl font-bold text-text-inverted mt-1">{plans.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted">Active Client Regimens</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activePlansCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted">Athletes with Active Plans</p>
            <p className="text-2xl font-bold text-text-inverted mt-1">
              {uniqueAthletesWithPlan} / {assignedClients.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 bg-brand-surface border border-brand-border rounded-xl flex items-center gap-3">
        <Search className="w-4 h-4 text-text-muted ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by plan title, athlete name, or training goal..."
          className="flex-1 bg-transparent text-xs text-text-inverted placeholder:text-text-muted/60 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-text-muted hover:text-text-inverted mr-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Plans List / Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <p className="text-xs">Loading workout library...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
          <p>{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center bg-brand-surface border border-brand-border rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-inverted">No workout plans found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchQuery
              ? 'No workout routines match your current search query.'
              : 'You have not created any custom workout plans yet. Build a split routine for your athletes to get started.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Build First Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const difficultyBadgeColors = {
              beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            }[plan.difficulty] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

            return (
              <div
                key={plan.id}
                className="p-5 rounded-2xl bg-brand-surface border border-brand-border/70 hover:border-brand-border transition-colors flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${difficultyBadgeColors}`}
                    >
                      {plan.difficulty}
                    </span>

                    {plan.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ● Active Routine
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Archived
                      </span>
                    )}
                  </div>

                  {/* Title & Goal */}
                  <h3 className="text-base font-bold text-text-inverted leading-snug">
                    {plan.title}
                  </h3>
                  {plan.goal && (
                    <p className="text-xs text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {plan.goal}
                    </p>
                  )}

                  {/* Athlete Card */}
                  <div className="mt-3 p-2.5 rounded-xl bg-brand-dark/40 border border-brand-border/50 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                        Assigned Athlete
                      </span>
                      <span className="font-semibold text-text-inverted">
                        {plan.memberName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                        Split Days
                      </span>
                      <span className="font-bold text-emerald-400">
                        {plan.daysCount || 0} {plan.daysCount === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>

                  {/* Notes Preview if available */}
                  {plan.notes && (
                    <p className="mt-2.5 text-xs text-text-muted italic line-clamp-2">
                      "{plan.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-brand-border/40 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-text-muted">
                    Updated {new Date(plan.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(plan)}
                      className="px-2.5 py-1 rounded-lg bg-brand-dark/80 hover:bg-brand-dark text-text-inverted border border-brand-border transition-colors font-medium inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-text-muted" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id, plan.title)}
                      className="p-1.5 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Builder Modal */}
      <WorkoutPlanFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
          setInitialMemberId(null);
        }}
        onSuccess={() => {
          loadData();
        }}
        assignedClients={assignedClients}
        initialMemberId={initialMemberId}
        existingPlan={editingPlan}
      />
    </div>
  );
}
