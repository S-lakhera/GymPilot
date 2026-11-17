import { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { coachingApi } from '../../api/coachingApi.js';
import { useToast } from '../../hooks/useToast.js';

export function RequestCoachModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTrainer(null);
      setNotes('');
      setFetchError(null);
      return;
    }

    openerRef.current = document.activeElement;
    setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    let isMounted = true;
    const fetchTrainers = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await coachingApi.getTrainersWithCapacity();
        if (isMounted) {
          setTrainers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load trainer catalog.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrainers();
    return () => {
      isMounted = false;
      openerRef.current?.focus?.();
    };
  }, [isOpen]);

  // Handle escape key and tab trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    setIsSubmitting(true);
    try {
      await coachingApi.requestTrainer({
        trainerId: selectedTrainer.id || selectedTrainer.trainerId,
        notes: notes.trim(),
      });
      showToast({
        type: 'success',
        message: `Coaching request sent to ${selectedTrainer.fullName || selectedTrainer.first_name || 'Coach'}. Waiting for admin confirmation.`,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to submit coaching request. Please check your membership pass.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrainers = trainers.filter((coach) => {
    if (genderFilter === 'ALL') return true;
    return (coach.gender || 'male').toLowerCase() === genderFilter.toLowerCase();
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 my-8 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-coach-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              1-on-1 Personal Coaching
            </div>
            <h2 id="request-coach-title" className="text-lg sm:text-xl font-bold text-text-inverted">
              Connect With a Personal Coach
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Select an elite certified trainer to build your customized training program and hold you accountable.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-inverted hover:bg-brand-dark/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-16 text-center text-text-muted space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
            <p className="text-xs">Loading available coaches...</p>
          </div>
        ) : fetchError ? (
          <div className="p-6 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300">{fetchError}</p>
          </div>
        ) : selectedTrainer ? (
          /* STEP 2: Selected Coach Confirmation & Notes */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-dark/50 border border-brand-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
                  {(selectedTrainer.fullName || selectedTrainer.first_name || 'C')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-inverted">
                      {selectedTrainer.fullName || `${selectedTrainer.first_name || ''} ${selectedTrainer.last_name || ''}`.trim()}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        selectedTrainer.gender === 'female'
                          ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {selectedTrainer.gender === 'female' ? 'Female' : 'Male'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {selectedTrainer.specialization || 'Certified Coach'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                className="text-xs text-text-muted hover:text-emerald-400 underline underline-offset-2 transition-colors"
              >
                Change Coach
              </button>
            </div>

            <div>
              <label htmlFor="coach-notes" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Training Goals & Preferences (Optional)
              </label>
              <textarea
                id="coach-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Focus on strength & hypertrophy, recover from shoulder injury, prepare for 5k run..."
                rows={3}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-text-inverted placeholder:text-text-muted focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Requires an active gym pass. Once submitted, the gym desk reviews and activates your assignment.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-inverted hover:bg-brand-dark/50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Coaching Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: Trainer Selection Roster */
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">
                {filteredTrainers.length} Certified {filteredTrainers.length === 1 ? 'Coach' : 'Coaches'} Available
              </span>
              <div className="flex items-center gap-1 p-1 bg-brand-dark/60 border border-brand-border rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setGenderFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    genderFilter === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-text-muted hover:text-text-inverted'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    genderFilter === 'male'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-text-muted hover:text-text-inverted'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    genderFilter === 'female'
                      ? 'bg-fuchsia-500 text-slate-950 font-semibold'
                      : 'text-text-muted hover:text-text-inverted'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Coaches List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredTrainers.length === 0 ? (
                <div className="col-span-full p-8 text-center text-text-muted text-xs">
                  No coaches match the selected filter.
                </div>
              ) : (
                filteredTrainers.map((coach) => {
                  const coachId = coach.id || coach.trainerId;
                  const fullName =
                    coach.fullName ||
                    `${coach.first_name || ''} ${coach.last_name || ''}`.trim() ||
                    'Coach';
                  const activeCount = Number(coach.activeClientsCount ?? coach.active_clients_count ?? 0);
                  const maxClients = Number(coach.maxClients ?? coach.max_clients ?? 10);
                  const isAtCapacity =
                    coach.is_at_capacity !== undefined
                      ? Boolean(coach.is_at_capacity)
                      : activeCount >= maxClients;

                  return (
                    <div
                      key={coachId}
                      className="p-3.5 rounded-xl bg-brand-dark/40 border border-brand-border flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                              {fullName[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-inverted truncate">
                                {fullName}
                              </h4>
                              <p className="text-[11px] text-emerald-400 font-medium truncate">
                                {coach.specialization || 'Certified Coach'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              isAtCapacity
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isAtCapacity ? 'Full' : `${maxClients - activeCount} open`}
                          </span>
                        </div>

                        {coach.experienceYears !== undefined && (
                          <div className="flex items-center gap-1 text-[11px] text-text-muted mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{coach.experienceYears} Years Experience</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTrainer(coach)}
                        disabled={isAtCapacity}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Select Coach</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestCoachModal;
