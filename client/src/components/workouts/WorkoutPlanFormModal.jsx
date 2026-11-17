import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Dumbbell, AlertCircle, Loader2 } from 'lucide-react';
import { useWorkoutPlan } from '../../hooks/useWorkoutPlan.js';

export function WorkoutPlanFormModal({
  isOpen,
  onClose,
  onSuccess,
  assignedClients = [],
  initialMemberId = null,
  existingPlan = null,
}) {
  const { exercises, isLoadingExercises, addCustomExercise, savePlan } = useWorkoutPlan();

  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState([
    {
      dayNumber: 1,
      dayName: 'Day 1 - Push Focus',
      warmupNotes: '',
      exercises: [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
    },
  ]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Custom exercise inline popover
  const [showCustomExModal, setShowCustomExModal] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState('chest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const modalRef = useRef(null);

  // Initialize form when opening
  useEffect(() => {
    if (!isOpen) return;

    if (existingPlan) {
      setMemberId(String(existingPlan.memberId || ''));
      setTitle(existingPlan.title || '');
      setGoal(existingPlan.goal || '');
      setDifficulty(existingPlan.difficulty || 'intermediate');
      setNotes(existingPlan.notes || '');

      if (Array.isArray(existingPlan.days) && existingPlan.days.length > 0) {
        setDays(
          existingPlan.days.map((d, dIdx) => ({
            dayNumber: d.dayNumber || dIdx + 1,
            dayName: d.dayName || `Day ${dIdx + 1}`,
            warmupNotes: d.warmupNotes || '',
            exercises: Array.isArray(d.exercises) && d.exercises.length > 0
              ? d.exercises.map((e) => ({
                  exerciseId: e.exerciseId ? String(e.exerciseId) : '',
                  customName: e.customName || '',
                  sets: e.sets || 3,
                  reps: e.reps || '10-12',
                  restSeconds: e.restSeconds ?? 60,
                  notes: e.notes || '',
                }))
              : [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
          }))
        );
      } else {
        setDays([
          {
            dayNumber: 1,
            dayName: 'Day 1 - Push Focus',
            warmupNotes: '',
            exercises: [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
          },
        ]);
      }
      setActiveDayIdx(0);
    } else {
      setMemberId(initialMemberId ? String(initialMemberId) : (assignedClients[0]?.memberId ? String(assignedClients[0].memberId) : ''));
      setTitle('');
      setGoal('Hypertrophy & Strength');
      setDifficulty('intermediate');
      setNotes('');
      setDays([
        {
          dayNumber: 1,
          dayName: 'Day 1 - Push Focus',
          warmupNotes: '',
          exercises: [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
        },
      ]);
      setActiveDayIdx(0);
    }
    setFormError(null);
  }, [isOpen, existingPlan, initialMemberId, assignedClients]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Add Day
  const handleAddDay = () => {
    const newDayNum = days.length + 1;
    const defaultNames = ['Push Focus', 'Pull Focus', 'Legs & Core', 'Upper Body', 'Lower Body', 'Full Body Conditioning'];
    const suggestedName = defaultNames[newDayNum - 1] || `Routine ${newDayNum}`;

    setDays([
      ...days,
      {
        dayNumber: newDayNum,
        dayName: `Day ${newDayNum} - ${suggestedName}`,
        warmupNotes: '',
        exercises: [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
      },
    ]);
    setActiveDayIdx(days.length);
  };

  // Remove Day
  const handleRemoveDay = (idxToRemove) => {
    if (days.length <= 1) return;
    const updated = days
      .filter((_, idx) => idx !== idxToRemove)
      .map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
    setDays(updated);
    setActiveDayIdx(Math.max(0, activeDayIdx > idxToRemove ? activeDayIdx - 1 : Math.min(activeDayIdx, updated.length - 1)));
  };

  // Update current day field
  const handleCurrentDayChange = (field, val) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[activeDayIdx] = { ...copy[activeDayIdx], [field]: val };
      return copy;
    });
  };

  // Add exercise to active day
  const handleAddExercise = () => {
    setDays((prev) => {
      const copy = [...prev];
      const curExercises = copy[activeDayIdx].exercises || [];
      copy[activeDayIdx] = {
        ...copy[activeDayIdx],
        exercises: [
          ...curExercises,
          { exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' },
        ],
      };
      return copy;
    });
  };

  // Remove exercise from active day
  const handleRemoveExercise = (exIdx) => {
    setDays((prev) => {
      const copy = [...prev];
      const curExercises = copy[activeDayIdx].exercises.filter((_, idx) => idx !== exIdx);
      copy[activeDayIdx] = {
        ...copy[activeDayIdx],
        exercises: curExercises.length > 0 ? curExercises : [{ exerciseId: '', customName: '', sets: 3, reps: '10-12', restSeconds: 60, notes: '' }],
      };
      return copy;
    });
  };

  // Update exercise field
  const handleExerciseChange = (exIdx, field, val) => {
    setDays((prev) => {
      const copy = [...prev];
      const curExercises = [...copy[activeDayIdx].exercises];
      curExercises[exIdx] = { ...curExercises[exIdx], [field]: val };
      copy[activeDayIdx] = { ...copy[activeDayIdx], exercises: curExercises };
      return copy;
    });
  };

  // Save new custom exercise
  const handleSaveCustomExercise = async (e) => {
    e.preventDefault();
    if (!customExName.trim()) return;
    const res = await addCustomExercise({
      name: customExName.trim(),
      muscleGroup: customExMuscle,
    });
    if (res.success && res.exercise) {
      // Auto-assign created custom exercise to current exercise slot if empty
      const curExercises = days[activeDayIdx].exercises;
      const lastIdx = curExercises.length - 1;
      if (lastIdx >= 0 && !curExercises[lastIdx].exerciseId) {
        handleExerciseChange(lastIdx, 'exerciseId', String(res.exercise.id));
      }
      setShowCustomExModal(false);
      setCustomExName('');
    }
  };

  // Submit Plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!memberId) {
      setFormError('Please select an athlete for this workout plan.');
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setFormError('Please provide a workout plan title (at least 3 characters).');
      return;
    }

    // Validate days & exercises
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day.dayName.trim()) {
        setFormError(`Day ${i + 1} must have a title.`);
        return;
      }
      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
        if (!ex.exerciseId && !ex.customName?.trim()) {
          setFormError(`Please select an exercise or provide a custom name for Exercise #${j + 1} on Day ${i + 1}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        memberId: parseInt(memberId, 10),
        title: title.trim(),
        goal: goal.trim() || null,
        difficulty,
        notes: notes.trim() || null,
        days: days.map((d, dIdx) => ({
          dayNumber: d.dayNumber || dIdx + 1,
          dayName: d.dayName.trim(),
          warmupNotes: d.warmupNotes?.trim() || null,
          orderIndex: dIdx + 1,
          exercises: d.exercises.map((e, eIdx) => {
            const parsedSets = parseInt(e.sets, 10);
            const parsedRest = parseInt(e.restSeconds, 10);
            return {
              exerciseId: e.exerciseId ? parseInt(e.exerciseId, 10) : null,
              customName: !e.exerciseId && e.customName ? e.customName.trim() : null,
              sets: Math.max(1, !isNaN(parsedSets) ? parsedSets : 3),
              reps: String(e.reps || '10-12').trim(),
              restSeconds: Math.max(0, !isNaN(parsedRest) ? parsedRest : 60),
              notes: e.notes?.trim() || null,
              orderIndex: eIdx + 1,
            };
          }),
        })),
      };

      const result = await savePlan(payload, existingPlan?.id);
      if (result.success) {
        onSuccess?.(result.plan);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDay = days[activeDayIdx] || days[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-brand-border/60 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-inverted">
                {existingPlan ? 'Edit Workout Plan' : 'Create Workout Plan'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Design custom day splits, target sets, and rep prescriptions for your athlete.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-inverted hover:bg-brand-dark/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Top Row: Athlete, Title, Goal, Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Assigned Athlete <span className="text-rose-400">*</span>
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={Boolean(existingPlan) || Boolean(initialMemberId)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-dark/70 border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                required
              >
                <option value="">Select Athlete...</option>
                {assignedClients.map((c) => (
                  <option key={c.memberId} value={c.memberId}>
                    {c.memberName} (#{c.memberId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Plan Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3-Day Hypertrophy Split"
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-dark/70 border border-brand-border text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Primary Goal
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Strength & Muscle Gain"
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-dark/70 border border-brand-border text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-dark/70 border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Coaching Notes */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Trainer Instructions / Overview Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Emphasize a 3-second eccentric on compound lifts. Rest 90-120 seconds between sets."
              className="w-full px-3 py-2 text-xs rounded-lg bg-brand-dark/70 border border-brand-border text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Days Tabs Bar */}
          <div className="pt-2 border-t border-brand-border/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-text-inverted uppercase tracking-wider">
                Workout Split Routines ({days.length} {days.length === 1 ? 'Day' : 'Days'})
              </label>
              <button
                type="button"
                onClick={handleAddDay}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Day
              </button>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/40">
              {days.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveDayIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeDayIdx === idx
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-brand-dark/70 text-text-muted hover:text-text-inverted border border-brand-border/50'
                  }`}
                >
                  <span>{day.dayName || `Day ${idx + 1}`}</span>
                  {days.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDay(idx);
                      }}
                      className="hover:text-rose-400 hover:scale-110 transition-transform p-0.5"
                      title="Remove Day"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Day Configuration */}
          {currentDay && (
            <div className="space-y-4 bg-brand-dark/30 p-4 rounded-xl border border-brand-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Day Label / Focus <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentDay.dayName}
                    onChange={(e) => handleCurrentDayChange('dayName', e.target.value)}
                    placeholder="e.g. Day 1 - Push Focus (Chest, Delts, Triceps)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Warm-Up Routine / Mobility Notes
                  </label>
                  <input
                    type="text"
                    value={currentDay.warmupNotes}
                    onChange={(e) => handleCurrentDayChange('warmupNotes', e.target.value)}
                    placeholder="e.g. 5 min rowing machine + shoulder dislocations"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Exercises Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    Exercises for this Day ({currentDay.exercises.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomExModal(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      + Custom Movement
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-brand-dark/80 hover:bg-brand-dark text-text-inverted border border-brand-border transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Exercise
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {currentDay.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3 rounded-lg bg-slate-950/80 border border-brand-border/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      {/* Movement select or custom name */}
                      <div className="sm:col-span-4">
                        <select
                          value={ex.exerciseId}
                          onChange={(e) => handleExerciseChange(exIdx, 'exerciseId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Select Movement...</option>
                          {/* Group by muscle group */}
                          {['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio'].map((group) => {
                            const groupExercises = exercises.filter((item) => item.muscleGroup === group);
                            if (groupExercises.length === 0) return null;
                            return (
                              <optgroup key={group} label={group.toUpperCase()}>
                                {groupExercises.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} {item.equipment ? `(${item.equipment})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                        {!ex.exerciseId && (
                          <input
                            type="text"
                            value={ex.customName || ''}
                            onChange={(e) => handleExerciseChange(exIdx, 'customName', e.target.value)}
                            placeholder="Or enter custom exercise..."
                            className="mt-1 w-full px-2.5 py-1 text-[11px] rounded-md bg-brand-dark/60 border border-brand-border/60 text-text-inverted placeholder:text-text-muted/50 focus:outline-none"
                          />
                        )}
                      </div>

                      {/* Sets */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-text-muted mb-0.5 sm:hidden">Sets</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={ex.sets}
                          onChange={(e) => handleExerciseChange(exIdx, 'sets', e.target.value)}
                          placeholder="Sets (3)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500 text-center"
                          title="Target Sets"
                        />
                      </div>

                      {/* Reps */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-text-muted mb-0.5 sm:hidden">Reps</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => handleExerciseChange(exIdx, 'reps', e.target.value)}
                          placeholder="Reps (10-12)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500 text-center"
                          title="Target Reps (e.g. 10-12, Failure)"
                        />
                      </div>

                      {/* Rest Seconds */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-text-muted mb-0.5 sm:hidden">Rest (s)</label>
                        <input
                          type="number"
                          step="15"
                          min="0"
                          max="300"
                          value={ex.restSeconds}
                          onChange={(e) => handleExerciseChange(exIdx, 'restSeconds', e.target.value)}
                          placeholder="Rest (s)"
                          className="w-full px-1.5 py-1.5 text-xs rounded-md bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500 text-center"
                          title="Rest in seconds"
                        />
                      </div>

                      {/* Notes / Cues */}
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={ex.notes || ''}
                          onChange={(e) => handleExerciseChange(exIdx, 'notes', e.target.value)}
                          placeholder="Cues / RPE / Tempo..."
                          className="w-full px-2 py-1.5 text-xs rounded-md bg-brand-dark border border-brand-border text-text-inverted placeholder:text-text-muted/50 focus:outline-none focus:border-emerald-500"
                          title="Coaching Cues"
                        />
                      </div>

                      {/* Delete Exercise */}
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(exIdx)}
                          className="p-1.5 rounded text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove Exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Custom Exercise Mini Modal */}
          {showCustomExModal && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Movement to Catalog
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomExModal(false)}
                  className="text-text-muted hover:text-text-inverted text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                  placeholder="e.g. Landmine Press"
                  className="px-3 py-1.5 text-xs rounded-lg bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={customExMuscle}
                  onChange={(e) => setCustomExMuscle(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-brand-dark border border-brand-border text-text-inverted focus:outline-none focus:border-emerald-500"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="legs">Legs</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="core">Core</option>
                  <option value="full_body">Full Body</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomExModal(false)}
                  className="px-2.5 py-1 text-xs rounded-md bg-brand-dark text-text-muted hover:text-text-inverted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomExercise}
                  className="px-3 py-1 text-xs rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                >
                  Save Movement
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brand-border/60 flex items-center justify-end gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-brand-border/70 text-xs font-medium text-text-muted hover:text-text-inverted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{existingPlan ? 'Update Plan' : 'Save & Assign Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
