import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  CheckCircle2,
  CheckCircle,
  Circle,
  Clock,
  Flame,
  Award,
  Sparkles,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Mail,
  Phone,
  Users,
  XCircle,
} from 'lucide-react';
import { workoutApi } from '../../api/workoutApi.js';
import { coachingApi } from '../../api/coachingApi.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDateIST } from '../../utils/formatters.js';
import { ROUTES } from '../../utils/constants.js';
import { RequestCoachModal } from '../../components/workouts/RequestCoachModal.jsx';

export function MemberWorkoutsPage() {
  const { showToast } = useToast();
  const [plan, setPlan] = useState(null);
  const [coach, setCoach] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isRequestCoachOpen, setIsRequestCoachOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Local storage synced checklist: { [exerciseIdOrIndex]: boolean }
  const [completedMap, setCompletedMap] = useState({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [planData, coachingStatus] = await Promise.all([
        workoutApi.getMyPlan(),
        coachingApi.getMemberStatus(),
      ]);

      setPlan(planData || null);

      const rawAssignment = coachingStatus?.currentAssignment || coachingStatus?.assignment;
      if (rawAssignment) {
        setCoach({
          id: rawAssignment.id,
          status: rawAssignment.status,
          trainerName:
            rawAssignment.trainerName ||
            `${rawAssignment.trainer_first_name || ''} ${rawAssignment.trainer_last_name || ''}`.trim() ||
            'Trainer',
          trainerGender:
            rawAssignment.trainerGender || rawAssignment.trainer_gender || rawAssignment.gender || 'male',
          specialization:
            rawAssignment.specialization || rawAssignment.trainer_specialization || 'Certified Coach',
          experienceYears:
            rawAssignment.experienceYears ?? rawAssignment.trainer_experience_years ?? 0,
          assignedAt:
            rawAssignment.assignedAt || rawAssignment.start_date || rawAssignment.created_at,
          gracePeriodEndsAt:
            rawAssignment.gracePeriodEndsAt || rawAssignment.grace_period_ends_at,
          trainerEmail: rawAssignment.trainerEmail || rawAssignment.trainer_email,
          trainerPhone: rawAssignment.trainerPhone || rawAssignment.trainer_phone,
          certifications:
            rawAssignment.certifications || rawAssignment.trainer_certification,
        });
      } else {
        setCoach(null);
      }

      const rawPending = coachingStatus?.pendingRequest;
      if (rawPending) {
        setPendingRequest({
          requestId: rawPending.id || rawPending.requestId,
          trainerName:
            rawPending.trainerName ||
            `${rawPending.trainer_first_name || ''} ${rawPending.trainer_last_name || ''}`.trim() ||
            'Coach',
          trainerGender: rawPending.trainerGender || rawPending.trainer_gender || 'male',
          trainerSpecialization:
            rawPending.trainerSpecialization || rawPending.trainer_specialization || 'Personal Trainer',
          requestedAt: rawPending.requestedAt || rawPending.requested_at || rawPending.created_at,
          notes: rawPending.notes,
        });
      } else {
        setPendingRequest(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your active workout plan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    setIsCancelling(true);
    try {
      await coachingApi.cancelRequest(requestId);
      showToast({ type: 'info', message: 'Coaching request cancelled successfully.' });
      await loadData();
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to cancel coaching request.' });
    } finally {
      setIsCancelling(false);
    }
  };

  const activeDay = plan?.days?.[activeDayIdx] || plan?.days?.[0] || null;

  // Sync checklist from localStorage when activeDay changes
  useEffect(() => {
    if (!plan || !activeDay) return;
    const storageKey = `gympilot_workout_${plan.id}_day_${activeDay.dayNumber}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedMap(JSON.parse(saved));
      } else {
        setCompletedMap({});
      }
    } catch {
      setCompletedMap({});
    }
  }, [plan, activeDay]);

  // Toggle exercise completion
  const handleToggleExercise = (exIdOrIdx) => {
    if (!plan || !activeDay) return;
    const storageKey = `gympilot_workout_${plan.id}_day_${activeDay.dayNumber}`;
    setCompletedMap((prev) => {
      const updated = { ...prev, [exIdOrIdx]: !prev[exIdOrIdx] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore localStorage quota errors
      }
      return updated;
    });
  };

  // Reset checklist for active day
  const handleResetChecklist = () => {
    if (!plan || !activeDay) return;
    const storageKey = `gympilot_workout_${plan.id}_day_${activeDay.dayNumber}`;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setCompletedMap({});
  };

  const totalExercises = activeDay?.exercises?.length || 0;
  const completedExercisesCount = activeDay?.exercises?.filter(
    (e, idx) => completedMap[e.id || idx]
  ).length || 0;
  const progressPercent = totalExercises > 0
    ? Math.round((completedExercisesCount / totalExercises) * 100)
    : 0;

  const difficultyColors = {
    beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }[plan?.difficulty] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Dumbbell className="w-4 h-4" />
            Member Training Workspace
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-inverted">
            My Workout Regimen
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Follow your personalized training routine, track sets and reps, and execute each movement.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-16 text-center text-text-muted space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
          <p className="text-xs">Loading your workout routine...</p>
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
      ) : (
        <div className="space-y-6">
          {/* Grace Period Alert Banner if PAUSED */}
          {coach && coach.status === 'PAUSED' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="font-semibold text-sm">
                    Coaching Paused — 10-Day Grace Period Active
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Your membership pass has expired. Your 1-on-1 coach assignment remains reserved
                    {coach.gracePeriodEndsAt ? (
                      <> until <span className="font-bold underline">{formatDateIST(coach.gracePeriodEndsAt)}</span></>
                    ) : null}
                    . Renew any active pass to restore your coaching sessions instantly!
                  </p>
                </div>
              </div>
              <Link
                to={ROUTES.PLANS}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-brand-dark font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm self-start sm:self-auto"
              >
                Renew Gym Pass
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Assigned Coach Card (Streamlined: no about bio, no coaching target) */}
          {coach && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-accent/10 border border-emerald-accent/30 flex items-center justify-center text-emerald-accent font-bold text-xl shadow-inner shrink-0">
                    {coach.trainerName?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-text-inverted truncate">
                        {coach.trainerName}
                      </h3>
                      {coach.trainerGender && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                            coach.trainerGender === 'female'
                              ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          }`}
                        >
                          {coach.trainerGender === 'female' ? 'Female' : 'Male'}
                        </span>
                      )}
                      {coach.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Active Coach
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-emerald-accent mt-0.5">
                      {coach.specialization || 'Certified Personal Coach'}
                    </p>
                    <div className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {coach.experienceYears !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {coach.experienceYears} Years Exp.
                        </span>
                      )}
                      {coach.assignedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Assigned {formatDateIST(coach.assignedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Coach Contacts */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {coach.trainerEmail && (
                    <a
                      href={`mailto:${coach.trainerEmail}`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-dark/50 border border-brand-border text-xs text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-accent shrink-0" />
                      <span className="truncate">{coach.trainerEmail}</span>
                    </a>
                  )}
                  {coach.trainerPhone && (
                    <a
                      href={`tel:${coach.trainerPhone}`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-dark/50 border border-brand-border text-xs text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-accent shrink-0" />
                      <span>{coach.trainerPhone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Compact Credentials */}
              {coach.certifications && (
                <div className="pt-3 border-t border-brand-border/60 mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mr-1 flex items-center gap-1">
                    <Award className="w-3 h-3 text-emerald-accent" />
                    Credentials:
                  </span>
                  {coach.certifications.split(',').map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-brand-dark/60 border border-brand-border text-xs text-text-inverted font-medium"
                    >
                      {cert.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Coach Request Banner */}
          {pendingRequest && !coach && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-text-inverted">
                        Coaching Request Under Review
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Admin Approval
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Requested on {formatDateIST(pendingRequest.requestedAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCancelRequest(pendingRequest.requestId)}
                  disabled={isCancelling}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors disabled:opacity-50 self-start sm:self-auto"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isCancelling ? 'Cancelling...' : 'Cancel Request'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                    Requested Coach
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-inverted">
                      {pendingRequest.trainerName}
                    </span>
                    {pendingRequest.trainerGender && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          pendingRequest.trainerGender === 'female'
                            ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {pendingRequest.trainerGender === 'female' ? 'Female' : 'Male'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {pendingRequest.trainerSpecialization}
                  </p>
                </div>

                {pendingRequest.notes && (
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                      Your Note / Goals
                    </span>
                    <p className="text-xs text-text-muted bg-brand-dark/50 p-2.5 rounded-lg border border-brand-border italic">
                      "{pendingRequest.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coaching Invitation Banner for unassigned members */}
          {!coach && !pendingRequest && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-inverted">
                    1-on-1 Personal Coaching
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Level up your workouts with personalized guidance and nutrition tips from certified trainers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestCoachOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2 shrink-0"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Connect With a Personal Coach</span>
              </button>
            </div>
          )}

          {!plan ? (
            /* Empty State */
            <div className="p-10 sm:p-14 text-center bg-brand-surface border border-brand-border rounded-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Dumbbell className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-text-inverted">
                  {coach
                    ? 'Workout Plan in Preparation'
                    : pendingRequest
                    ? 'Coaching Assignment Pending'
                    : 'No Workout Plan Assigned Yet'}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {coach
                    ? `Your coach (${coach.trainerName}) has not created a tailored workout split for your profile yet. Once assigned, your routine, exercises, sets, and rest intervals will appear here.`
                    : pendingRequest
                    ? `Your request to train with coach ${pendingRequest.trainerName} is currently waiting for desk review. Once approved, your personalized training plan will be assigned.`
                    : 'You do not have an active workout routine or assigned coach yet. Connect with an elite certified coach from our coaching roster to receive a personalized split.'}
                </p>
              </div>
            </div>
          ) : (
            /* Plan Showcase */
            <div className="space-y-6">
          {/* Plan Hero Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${difficultyColors}`}
                  >
                    {plan.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active Program
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-text-inverted">
                  {plan.title}
                </h2>
                {plan.goal && (
                  <p className="text-xs sm:text-sm text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Goal: {plan.goal}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-text-muted bg-brand-dark/40 px-3.5 py-2.5 rounded-xl border border-brand-border/60 self-start sm:self-auto">
                <div>
                  <span className="text-[10px] uppercase tracking-wider block">Split Days</span>
                  <strong className="text-emerald-400 font-bold text-sm">
                    {plan.days?.length || 0} Sessions
                  </strong>
                </div>
              </div>
            </div>

            {/* Coach Notes */}
            {plan.notes && (
              <div className="p-3 rounded-xl bg-brand-dark/50 border border-brand-border/50 text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-text-inverted mr-1.5">Coach Instructions:</span>
                "{plan.notes}"
              </div>
            )}
          </div>

          {/* Day Split Tabs */}
          {plan.days && plan.days.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {plan.days.map((day, idx) => (
                  <button
                    key={day.id || idx}
                    type="button"
                    onClick={() => setActiveDayIdx(idx)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                      activeDayIdx === idx
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-brand-surface text-text-muted hover:text-text-inverted border border-brand-border'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{day.dayName || `Day ${idx + 1}`}</span>
                  </button>
                ))}
              </div>

              {/* Active Day Exercises Section */}
              {activeDay && (
                <div className="space-y-4">
                  {/* Warmup Notes Banner if provided */}
                  {activeDay.warmupNotes && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                      <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-200 uppercase tracking-wider text-[11px] block">
                          Day Warm-Up Protocol:
                        </span>
                        <span className="leading-relaxed mt-0.5 block">{activeDay.warmupNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* Session Checklist Header & Progress Bar */}
                  <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-muted">
                        Session Execution: <strong className="text-text-inverted">{completedExercisesCount} of {totalExercises} movements complete</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400">{progressPercent}%</span>
                        {completedExercisesCount > 0 && (
                          <button
                            type="button"
                            onClick={handleResetChecklist}
                            className="text-[11px] text-text-muted hover:text-text-inverted inline-flex items-center gap-1 transition-colors"
                            title="Reset checklist for today's session"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-brand-border/60 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Complete Celebration */}
                  {totalExercises > 0 && completedExercisesCount === totalExercises && (
                    <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-200">
                            🎉 Workout Complete! Great job crushing today's routine.
                          </p>
                          <p className="text-[11px] text-emerald-300/80 mt-0.5">
                            Stay hydrated, get your post-workout nutrition, and prioritize rest.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exercises List */}
                  <div className="space-y-3">
                    {activeDay.exercises?.map((ex, exIdx) => {
                      const isComplete = Boolean(completedMap[ex.id || exIdx]);

                      return (
                        <div
                          key={ex.id || exIdx}
                          onClick={() => handleToggleExercise(ex.id || exIdx)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start sm:items-center justify-between gap-3 ${
                            isComplete
                              ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80'
                              : 'bg-brand-surface border-brand-border hover:border-brand-border/90'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Accessible native checkbox with styled indicator */}
                            <label
                              htmlFor={`exercise-check-${ex.id || exIdx}`}
                              className="relative flex items-center justify-center cursor-pointer mt-0.5 sm:mt-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                id={`exercise-check-${ex.id || exIdx}`}
                                checked={isComplete}
                                onChange={() => handleToggleExercise(ex.id || exIdx)}
                                aria-label={`Mark ${ex.exerciseName || ex.customName || `Exercise ${exIdx + 1}`} as complete`}
                                className="sr-only"
                              />
                              {isComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                              ) : (
                                <Circle className="w-5 h-5 text-text-muted hover:text-emerald-400 transition-colors" />
                              )}
                            </label>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`text-sm font-bold transition-colors ${
                                    isComplete
                                      ? 'line-through text-text-muted'
                                      : 'text-text-inverted'
                                  }`}
                                >
                                  {ex.exerciseName || ex.customName || `Exercise ${exIdx + 1}`}
                                </h4>
                                {ex.muscleGroup && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-dark border border-brand-border text-emerald-400 uppercase tracking-wider">
                                    {ex.muscleGroup}
                                  </span>
                                )}
                              </div>

                              {/* Movement Notes / Cues */}
                              {ex.notes && (
                                <p className="text-xs text-text-muted italic mt-1">
                                  {ex.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Exercise Target Pills */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-brand-dark/90 border border-brand-border/60 text-xs font-semibold text-text-inverted">
                              {ex.sets} Sets
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-brand-dark/90 border border-brand-border/60 text-xs font-semibold text-emerald-400">
                              {ex.reps} Reps
                            </span>
                            {ex.restSeconds > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-dark/60 text-xs text-text-muted">
                                <Clock className="w-3 h-3 text-text-muted" />
                                {ex.restSeconds}s
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* Connect With a Personal Coach Modal */}
      <RequestCoachModal
        isOpen={isRequestCoachOpen}
        onClose={() => setIsRequestCoachOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
