import React, { useState } from 'react';
import {
  Users,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching.js';
import { formatDateIST } from '../../utils/formatters.js';

export function AdminCoachingPage() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'assignments' | 'trainers'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [reviewModal, setReviewModal] = useState(null); // request object
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [overrideCapacity, setOverrideCapacity] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [terminateModal, setTerminateModal] = useState(null); // assignment object
  const [terminateReason, setTerminateReason] = useState('ADMIN_TERMINATED');

  const {
    data,
    trainers,
    isLoading,
    isSubmitting,
    reviewCoachRequest,
    assignCoach,
    terminateCoachAssignment,
    syncGracePeriods,
    refresh,
  } = useCoaching({ search: searchTerm, status: statusFilter });

  const pendingRequests = data?.pendingRequests || [];
  const assignments = data?.assignments || [];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    try {
      await reviewCoachRequest(reviewModal.id, {
        action: reviewAction,
        rejectionReason: reviewAction === 'REJECT' ? rejectionReason : null,
        overrideCapacity,
      });
      setReviewModal(null);
      setRejectionReason('');
      setOverrideCapacity(false);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleDirectAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedTrainerId) return;
    try {
      await assignCoach({
        memberId: Number(selectedMemberId),
        trainerId: Number(selectedTrainerId),
        notes: assignNotes,
        overrideCapacity,
      });
      setAssignModalOpen(false);
      setSelectedMemberId('');
      setSelectedTrainerId('');
      setAssignNotes('');
      setOverrideCapacity(false);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    if (!terminateModal) return;
    try {
      await terminateCoachAssignment(terminateModal.id, {
        reason: terminateReason,
      });
      setTerminateModal(null);
    } catch {
      // Error handled by hook toast
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  const activeAssignmentsCount = assignments.filter((a) => a.status === 'ACTIVE').length;
  const pausedAssignmentsCount = assignments.filter((a) => a.status === 'PAUSED').length;
  const atCapacityTrainersCount = trainers.filter((t) => t.is_at_capacity).length;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" /> Coaching Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary">
            Trainer-Member Assignments Hub
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Review coaching requests, manage trainer loads, assign personal coaches, and enforce 10-day renewal grace policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Direct Assign</span>
          </button>

          <button
            onClick={syncGracePeriods}
            disabled={isSubmitting}
            title="Reconciles 10-day grace periods for expired passes and auto-terminates elapsed coaching slots."
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-muted text-text-inverted text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-accent ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Sync Grace Periods</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gym-card p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary text-xs font-medium">
            <span>Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-display text-text-primary">
            {pendingRequests.length}
          </div>
          <div className="text-[11px] text-amber-500 font-medium">Requires Admin action</div>
        </div>

        <div className="gym-card p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary text-xs font-medium">
            <span>Active Assignments</span>
            <UserCheck className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-3xl font-extrabold font-display text-text-primary">
            {activeAssignmentsCount}
          </div>
          <div className="text-[11px] text-emerald-accent font-medium">In active training</div>
        </div>

        <div className="gym-card p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary text-xs font-medium">
            <span>In Grace Period</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-display text-text-primary">
            {pausedAssignmentsCount}
          </div>
          <div className="text-[11px] text-amber-400 font-medium">10-day pass renewal pause</div>
        </div>

        <div className="gym-card p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary text-xs font-medium">
            <span>Coaches at Capacity</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold font-display text-text-primary">
            {atCapacityTrainersCount} <span className="text-xs font-normal text-text-secondary">/ {trainers.length}</span>
          </div>
          <div className="text-[11px] text-text-secondary font-medium">Max client slots full</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border/60">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-emerald-accent text-emerald-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Requests ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-emerald-accent text-emerald-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Assignments Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'trainers'
              ? 'border-emerald-accent text-emerald-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Coaches Capacity & Load</span>
        </button>
      </div>

      {/* TAB 1: Pending Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="gym-card p-12 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-accent mx-auto" />
              <h3 className="text-base font-bold text-text-primary">All Caught Up!</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                No member requests are currently waiting for admin review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto gym-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-surface/60 text-text-secondary uppercase tracking-wider text-[11px] border-b border-brand-border/60">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Requested Coach</th>
                    <th className="py-3 px-4">Notes / Goals</th>
                    <th className="py-3 px-4">Date Requested</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-workspace-border">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-brand-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-primary">
                          {req.member_first_name} {req.member_last_name}
                        </div>
                        <div className="text-[11px] text-text-secondary">{req.member_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          <span>{req.trainer_first_name} {req.trainer_last_name}</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                              req.trainer_gender === 'female'
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            }`}
                          >
                            {req.trainer_gender === 'female' ? 'Female' : 'Male'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-accent">{req.trainer_specialization}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-text-secondary">
                        {req.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {formatDateIST(req.requested_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setReviewModal(req);
                            setReviewAction('APPROVE');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-accent border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-xs transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Assignments Ledger */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search member or coach..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gym-input pl-9 text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="gym-input text-xs"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED (Grace)</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto gym-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surface/60 text-text-secondary uppercase tracking-wider text-[11px] border-b border-brand-border/60">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Coach</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Notes / Grace Expiry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-workspace-border">
                {assignments.map((item) => {
                  const statusColors = {
                    ACTIVE: 'bg-emerald-500/10 text-emerald-accent border-emerald-500/30',
                    PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    TERMINATED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
                  };

                  return (
                    <tr key={item.id} className="hover:bg-brand-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {item.member_first_name} {item.member_last_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">
                          {item.trainer_first_name} {item.trainer_last_name}
                        </div>
                        <div className="text-[10px] text-text-secondary">{item.trainer_specialization}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[item.status] || ''}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {formatDateIST(item.start_date)}
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-xs">
                        {item.status === 'PAUSED' ? (
                          <div className="text-amber-400 font-medium text-[11px]">
                            Grace ends: {formatDateIST(item.grace_period_ends_at)}
                          </div>
                        ) : item.status === 'TERMINATED' ? (
                          <div className="text-slate-400 text-[11px]">
                            Reason: {item.termination_reason}
                          </div>
                        ) : (
                          item.notes || '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status !== 'TERMINATED' && (
                          <button
                            onClick={() => setTerminateModal(item)}
                            className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-[11px] font-semibold transition-colors"
                          >
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Coaches Capacity & Load */}
      {activeTab === 'trainers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((coach) => {
            const percent = Math.min(100, Math.round((coach.active_clients_count / coach.max_clients) * 100));
            return (
              <div key={coach.id} className="gym-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-accent border border-emerald-500/30">
                      {coach.specialization}
                    </span>
                    {coach.is_at_capacity ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        At Capacity
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-accent">
                        Available
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-text-primary">
                        {coach.first_name} {coach.last_name}
                      </h3>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                          coach.gender === 'female'
                            ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {coach.gender === 'female' ? 'Female' : 'Male'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{coach.certification || 'Certified Coach'}</p>
                  </div>

                  {/* Load Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-workspace-border">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-text-secondary">Current Client Load</span>
                      <span className={coach.is_at_capacity ? 'text-red-400' : 'text-emerald-accent'}>
                        {coach.active_clients_count} / {coach.max_clients} Clients ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          coach.is_at_capacity ? 'bg-red-500' : percent > 75 ? 'bg-amber-400' : 'bg-emerald-accent'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTrainerId(coach.id);
                    setAssignModalOpen(true);
                  }}
                  className="w-full btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Member to {coach.first_name}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="gym-card max-w-md w-full p-6 space-y-5 border border-brand-border shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Review Coaching Request</h3>
              <p className="text-xs text-text-secondary mt-1">
                Member: <strong className="text-text-primary">{reviewModal.member_first_name} {reviewModal.member_last_name}</strong>
                {' '}➔ Coach: <strong className="text-text-primary">{reviewModal.trainer_first_name} {reviewModal.trainer_last_name}</strong>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      reviewAction === 'APPROVE'
                        ? 'bg-emerald-500/20 text-emerald-accent border-emerald-500/50'
                        : 'bg-brand-surface text-text-secondary border-brand-border'
                    }`}
                  >
                    Approve & Assign
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      reviewAction === 'REJECT'
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : 'bg-brand-surface text-text-secondary border-brand-border'
                    }`}
                  >
                    Reject Request
                  </button>
                </div>
              </div>

              {reviewAction === 'REJECT' ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-primary">Rejection Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a reason for the member..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="gym-input w-full text-xs"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                    <input
                      type="checkbox"
                      checked={overrideCapacity}
                      onChange={(e) => setOverrideCapacity(e.target.checked)}
                      className="rounded border-brand-border text-emerald-accent"
                    />
                    <span>Allow Admin Capacity Override (if coach is full)</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-workspace-border">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-4"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="gym-card max-w-md w-full p-6 space-y-5 border border-brand-border shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Direct Coach Assignment</h3>
              <p className="text-xs text-text-secondary mt-1">
                Assign or reassign an active gym member to a certified coach.
              </p>
            </div>

            <form onSubmit={handleDirectAssignSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Member ID</label>
                <input
                  type="number"
                  placeholder="Enter Member User ID (e.g. 9)"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="gym-input w-full text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Select Coach</label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="gym-input w-full text-xs"
                  required
                >
                  <option value="">Select a coach...</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.specialization}) — {t.active_clients_count}/{t.max_clients} clients
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Assignment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Goals or scheduling notes..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="gym-input w-full text-xs"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={overrideCapacity}
                    onChange={(e) => setOverrideCapacity(e.target.checked)}
                    className="rounded border-brand-border text-emerald-accent"
                  />
                  <span>Allow Capacity Override if coach is full</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-workspace-border">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-4"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {terminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="gym-card max-w-sm w-full p-6 space-y-4 border border-brand-border shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-text-primary">Terminate Assignment</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Terminate coaching for <strong className="text-text-primary">{terminateModal.member_first_name} {terminateModal.member_last_name}</strong> with Coach <strong className="text-text-primary">{terminateModal.trainer_first_name} {terminateModal.trainer_last_name}</strong>?
            </p>

            <form onSubmit={handleTerminateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-text-primary">Reason</label>
                <select
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="gym-input w-full text-xs"
                >
                  <option value="ADMIN_TERMINATED">Administrative Decision</option>
                  <option value="MANUAL_RELEASE">Mutual Coach-Client Release</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-workspace-border">
                <button
                  type="button"
                  onClick={() => setTerminateModal(null)}
                  className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                >
                  {isSubmitting ? 'Terminating...' : 'Terminate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoachingPage;

