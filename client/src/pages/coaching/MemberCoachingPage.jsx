import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Dumbbell,
  Calendar,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Send,
  ShieldCheck,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching.js';
import { formatDateIST } from '../../utils/formatters.js';
import { ROUTES } from '../../utils/constants.js';

export function MemberCoachingPage() {
  const [requestModalCoach, setRequestModalCoach] = useState(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const {
    data,
    trainers,
    isLoading,
    isSubmitting,
    requestCoach,
    cancelCoachRequest,
    refresh,
  } = useCoaching();

  const assignment = data?.assignment;
  const pendingRequest = data?.pendingRequest;
  const hasActivePass = Boolean(data?.hasActivePass);
  const activePassSummary = data?.activePassSummary;

  // Handles requesting a coach
  const handleOpenRequest = (coach) => {
    setRequestModalCoach(coach);
    setRequestNotes('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestModalCoach) return;
    try {
      await requestCoach({
        trainerId: requestModalCoach.trainerId,
        notes: requestNotes.trim(),
      });
      setRequestModalCoach(null);
    } catch (err) {
      // Error handled by hook toast
    }
  };

  // Handles canceling pending request
  const handleConfirmCancel = async () => {
    if (!pendingRequest?.requestId) return;
    try {
      await cancelCoachRequest(pendingRequest.requestId);
      setCancelModalOpen(false);
    } catch (err) {
      // Error handled by hook toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            Personal Coaching
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Connect with elite certified trainers for 1-on-1 personalized guidance and accountability.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-brand-surface border border-brand-border text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* STATE 1: ACTIVE OR PAUSED ASSIGNED COACH */}
      {assignment && (
        <div className="space-y-4 animate-fade-in">
          {/* Grace Period Alert Banner if PAUSED */}
          {assignment.status === 'PAUSED' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="font-semibold text-sm">
                    Coaching Paused — 10-Day Grace Period Active
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Your membership pass has expired. Your 1-on-1 coach assignment remains reserved until{' '}
                    <span className="font-bold underline">
                      {formatDateIST(assignment.gracePeriodEndsAt)}
                    </span>
                    . Renew any active pass to restore your coaching sessions instantly!
                  </p>
                </div>
              </div>
              <Link
                to={ROUTES.PLANS}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-brand-dark font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm"
              >
                Renew Gym Pass
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Assigned Coach Hero Card */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-brand-border/60">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-accent/10 border border-emerald-accent/30 flex items-center justify-center text-emerald-accent font-bold text-2xl shadow-inner">
                  {assignment.trainerName?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text-inverted">
                      {assignment.trainerName}
                    </h2>
                    {assignment.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Active Coach
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-emerald-accent mt-0.5">
                    {assignment.specialization || 'Certified Personal Coach'}
                  </p>
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {assignment.experienceYears} Years Professional Experience
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Assigned {formatDateIST(assignment.assignedAt)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Direct Coach Contacts */}
              <div className="flex flex-wrap items-center gap-2">
                {assignment.trainerEmail && (
                  <a
                    href={`mailto:${assignment.trainerEmail}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-dark/50 border border-brand-border text-xs text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-accent" />
                    <span>{assignment.trainerEmail}</span>
                  </a>
                )}
                {assignment.trainerPhone && (
                  <a
                    href={`tel:${assignment.trainerPhone}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-dark/50 border border-brand-border text-xs text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-accent" />
                    <span>{assignment.trainerPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Coach Details & Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Bio */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-accent" />
                  About Your Coach
                </h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  {assignment.bio ||
                    'Your dedicated personal trainer focused on holistic conditioning, biomechanics, and sustainable athletic progression.'}
                </p>
              </div>

              {/* Certifications & Notes */}
              <div className="space-y-4">
                {assignment.certifications && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-accent" />
                      Certifications & Credentials
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.certifications.split(',').map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-brand-dark/60 border border-brand-border text-xs text-text-inverted font-medium"
                        >
                          {cert.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.notes && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Coaching Target / Notes
                    </h4>
                    <p className="text-xs italic text-text-muted bg-brand-dark/30 p-2.5 rounded-lg border border-brand-border">
                      "{assignment.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING REQUEST UNDER REVIEW */}
      {!assignment && pendingRequest && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-sm animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-inverted">
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
              onClick={() => setCancelModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Request
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                Selected Trainer
              </span>
              <p className="text-base font-semibold text-text-inverted">
                {pendingRequest.trainerName}
              </p>
              <p className="text-xs text-emerald-accent">
                {pendingRequest.trainerSpecialization || 'Personal Trainer'}
              </p>
            </div>
            {pendingRequest.notes && (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                  Your Message / Goals
                </span>
                <p className="text-xs text-text-muted bg-brand-dark/40 p-2.5 rounded-lg border border-brand-border italic">
                  "{pendingRequest.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: UNASSIGNED - TRAINER CATALOG */}
      {!assignment && !pendingRequest && (
        <div className="space-y-6">
          {/* Active Pass Warning / Prerequisite Prompt */}
          {!hasActivePass ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">
                    Active Membership Pass Required
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    To request 1-on-1 personal coaching, you must hold an active gym pass or subscription.
                    You can browse our certified trainer roster below while choosing your membership pass.
                  </p>
                </div>
              </div>
              <Link
                to={ROUTES.PLANS}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-accent text-brand-dark font-semibold text-xs hover:bg-emerald-accent/90 transition-colors shadow-sm"
              >
                Browse Plans
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Active membership verified:{' '}
                  <span className="font-semibold">{activePassSummary?.planName || 'Active Pass'}</span>
                </span>
              </div>
              <span className="text-text-muted">Choose your preferred coach below</span>
            </div>
          )}

          {/* Trainer Catalog Header */}
          <div>
            <h3 className="text-lg font-bold text-text-inverted">
              Meet Our Certified Coaching Team
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Select a coach aligned with your personal goals. Once requested, the gym admin will confirm your slot.
            </p>
          </div>

          {/* Trainer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trainers.map((coach) => {
              const activeCount = Number(coach.activeClientsCount || 0);
              const maxClients = Number(coach.maxClients || 10);
              const isAtCapacity = activeCount >= maxClients;

              return (
                <div
                  key={coach.trainerId}
                  className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm hover:border-emerald-accent/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Initials & Capacity */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center text-emerald-accent font-bold text-lg">
                        {coach.fullName?.[0]?.toUpperCase() || 'T'}
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isAtCapacity
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isAtCapacity ? 'At Capacity' : `${maxClients - activeCount} spots open`}
                        </span>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {activeCount} / {maxClients} Athletes
                        </p>
                      </div>
                    </div>

                    {/* Coach Identity */}
                    <h4 className="text-base font-bold text-text-inverted">
                      {coach.fullName}
                    </h4>
                    <p className="text-xs font-medium text-emerald-accent mt-0.5">
                      {coach.specialization || 'Personal Trainer'}
                    </p>
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      {coach.experienceYears} Years Experience
                    </p>

                    {/* Bio */}
                    {coach.bio && (
                      <p className="text-xs text-text-muted mt-3 line-clamp-3 leading-relaxed">
                        {coach.bio}
                      </p>
                    )}

                    {/* Certifications */}
                    {coach.certifications && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {coach.certifications.split(',').slice(0, 3).map((cert, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-brand-dark border border-brand-border text-text-muted"
                          >
                            {cert.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-4 border-t border-brand-border/60">
                    <button
                      onClick={() => handleOpenRequest(coach)}
                      disabled={!hasActivePass}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-accent text-brand-dark font-semibold text-xs hover:bg-emerald-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Request Coaching
                    </button>
                    {!hasActivePass && (
                      <p className="text-[10px] text-center text-text-muted mt-1.5">
                        Pass required to request
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REQUEST COACH MODAL */}
      {requestModalCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-text-inverted">
                Request Coaching: {requestModalCoach.fullName}
              </h3>
              <button
                onClick={() => setRequestModalCoach(null)}
                className="text-text-muted hover:text-text-inverted text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="p-3 rounded-lg bg-brand-dark/50 border border-brand-border text-xs space-y-1">
                <p className="text-text-inverted font-semibold">
                  Coach Specialization: {requestModalCoach.specialization}
                </p>
                <p className="text-text-muted">
                  Client Load: {requestModalCoach.activeClientsCount || 0} / {requestModalCoach.maxClients || 10} athletes
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Fitness Goals & Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Share your target goals (e.g., strength training, fat loss, marathon prep) and preferred training times..."
                  className="w-full bg-brand-dark/50 border border-brand-border rounded-lg p-3 text-xs text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-accent/50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalCoach(null)}
                  className="px-4 py-2 rounded-lg bg-brand-dark border border-brand-border text-xs text-text-muted hover:text-text-inverted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-accent text-brand-dark font-semibold text-xs hover:bg-emerald-accent/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Coaching Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL PENDING REQUEST CONFIRMATION MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-text-inverted">
                Cancel Coaching Request?
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Are you sure you want to withdraw your pending request for{' '}
                <span className="font-semibold text-text-inverted">
                  {pendingRequest?.trainerName}
                </span>
                ? You can request another coach at any time.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-brand-dark border border-brand-border text-xs text-text-muted hover:text-text-inverted transition-colors"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Canceling...' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberCoachingPage;

