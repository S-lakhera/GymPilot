import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CalendarCheck,
  Dumbbell,
  Activity,
  HeartPulse,
  ShieldCheck,
  CheckCircle,
  FileText,
  X,
} from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching.js';
import { attendanceApi } from '../../api/attendanceApi.js';
import { AttendanceHeatmap } from '../../components/attendance/AttendanceHeatmap.jsx';
import { formatDateIST, formatDate } from '../../utils/formatters.js';

export function TrainerCoachingPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientModalTab, setClientModalTab] = useState('profile');
  const [clientAttendance, setClientAttendance] = useState({ data: null, isLoading: false, error: null });
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const overviewGenRef = useRef(0);
  const clientAttendanceGenRef = useRef(0);
  const selectedClientRef = useRef(null);
  selectedClientRef.current = selectedClient;
  const openerElementRef = useRef(null);
  const modalDialogRef = useRef(null);

  // Lock body scroll, focus modal, and trap Tab navigation when athlete profile modal is open
  useEffect(() => {
    if (selectedClient) {
      setTimeout(() => {
        modalDialogRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedClient(null);
        } else if (e.key === 'Tab' && modalDialogRef.current) {
          const focusable = modalDialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && (document.activeElement === first || document.activeElement === modalDialogRef.current)) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        clientAttendanceGenRef.current++;
        openerElementRef.current?.focus();
      };
    }
  }, [selectedClient]);

  const { data, isLoading, error, refresh } = useCoaching({ status: statusFilter, page });

  const fetchAttendanceOverview = async () => {
    const currentGen = ++overviewGenRef.current;
    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await attendanceApi.getTrainerOverview();
      if (currentGen === overviewGenRef.current) {
        setAttendanceOverview(res);
        setOverviewError(null);
      }
    } catch (err) {
      if (currentGen === overviewGenRef.current) {
        setOverviewError(err.message || 'Failed to load floor attendance overview.');
      }
    } finally {
      if (currentGen === overviewGenRef.current) {
        setIsOverviewLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAttendanceOverview();
  }, []);

  const handleRefresh = async () => {
    refresh();
    fetchAttendanceOverview();
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const loadClientAttendanceData = async (memberId) => {
    const currentGen = ++clientAttendanceGenRef.current;
    setClientAttendance({ data: null, isLoading: true, error: null });
    try {
      const res = await attendanceApi.getClientHistory(memberId, { limit: 10, days: 98 });
      if (currentGen === clientAttendanceGenRef.current && selectedClientRef.current?.memberId === memberId) {
        setClientAttendance({ data: res, isLoading: false, error: null });
      }
    } catch (err) {
      if (currentGen === clientAttendanceGenRef.current && selectedClientRef.current?.memberId === memberId) {
        setClientAttendance({ data: null, isLoading: false, error: err.message || 'Failed to load attendance' });
      }
    }
  };

  const openClientAttendance = async (client) => {
    openerElementRef.current = document.activeElement;
    setSelectedClient(client);
    setClientModalTab('attendance');
    loadClientAttendanceData(client.memberId);
  };

  const openClientProfile = (client) => {
    openerElementRef.current = document.activeElement;
    setSelectedClient(client);
    setClientModalTab('profile');
    setClientAttendance({ data: null, isLoading: false, error: null });
  };

  const trainerProfile = data?.trainerProfile || {};
  const activeCount = Number(data?.metrics?.activeClients ?? trainerProfile.activeClientsCount ?? 0);
  const maxClients = Number(data?.metrics?.maxClients ?? trainerProfile.maxClients ?? 10);
  const capacityPct = data?.metrics?.capacityPercent ?? Math.min(Math.round((activeCount / maxClients) * 100), 100);
  const rawAssignments = data?.assignments || [];

  const attendanceMap = new Map();
  if (attendanceOverview?.clients) {
    for (const c of attendanceOverview.clients) {
      attendanceMap.set(c.memberId, c);
    }
  }

  const assignments = rawAssignments.map((client) => {
    const memberId = client.member_id || client.memberId;
    const att = attendanceMap.get(memberId);
    const subscriptions = client.active_subscriptions || client.activeSubscriptions || [];
    const activePassName = subscriptions.length > 0 ? subscriptions[0]?.plan_name : (client.activePassName || null);

    return {
      ...client,
      memberId,
      assignmentId: client.id || client.assignmentId,
      memberName: client.memberName || `${client.member_first_name || ''} ${client.member_last_name || ''}`.trim() || 'Gym Member',
      memberGender: client.member_gender || client.memberGender || 'male',
      memberEmail: client.memberEmail || client.member_email,
      memberPhone: client.memberPhone || client.member_phone,
      assignedAt: client.assignedAt || client.start_date || client.created_at,
      gracePeriodEndsAt: client.gracePeriodEndsAt || client.grace_period_ends_at,
      healthConditions: client.healthConditions || client.health_conditions,
      emergencyContactName: client.emergencyContactName || client.emergency_contact_name,
      emergencyContactPhone: client.emergencyContactPhone || client.emergency_contact_phone,
      activePassName,
      activeSubscriptions: subscriptions,
      isCurrentlyInGym: att?.isCurrentlyInGym ?? false,
      hasVisitedToday: att?.hasVisitedToday ?? false,
      visitsThisMonth: att?.visitsThisMonth ?? null,
      totalVisits: att?.totalVisits ?? null,
      lastCheckInTime: att?.lastCheckInTime ?? null,
      lastDurationMinutes: att?.lastDurationMinutes ?? null,
    };
  });

  // Filter clients locally for instant search feedback
  const filteredClients = assignments.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.memberEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.memberPhone?.includes(searchTerm);
    return matchesSearch;
  });

  const pausedCount = assignments.filter((a) => a.status === 'PAUSED').length;

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="p-8 text-center bg-brand-surface border border-brand-border rounded-2xl shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-inverted mb-2">Failed to Load Client Roster</h2>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-emerald-accent hover:bg-emerald-accent/90 text-brand-dark text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            Coaching Roster & Client Attendance
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track assigned athletes, health conditions, active gym floor presence, and workout consistency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-brand-surface border border-brand-border text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {/* Capacity & Attendance Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Capacity Utilization Card */}
        <div className="sm:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center text-emerald-accent">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Client Capacity Load
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-text-inverted">
                    {activeCount}{' '}
                    <span className="text-sm font-normal text-text-muted">/ {maxClients}</span>
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      capacityPct >= 100
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : capacityPct >= 80
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {capacityPct}% Full
                  </span>
                </div>
              </div>
            </div>
            {trainerProfile?.specialization && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-dark/50 border border-brand-border text-text-muted">
                {trainerProfile.specialization}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2.5 rounded-full bg-brand-dark overflow-hidden border border-brand-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPct >= 100
                    ? 'bg-rose-500'
                    : capacityPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-accent'
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-text-muted">
              <span>{maxClients - activeCount > 0 ? `${maxClients - activeCount} client slots available` : 'At maximum capacity'}</span>
              <span>Soft limit: {maxClients} athletes</span>
            </div>
          </div>
        </div>

        {/* Active on Gym Floor Now */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                In Gym Floor Now
              </p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                {attendanceOverview?.metrics?.activeInGymNow ?? 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Currently checked in and training.</p>
        </div>

        {/* Visited Today */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Attended Today
              </p>
              <p className="text-2xl font-bold text-text-inverted mt-0.5">
                {attendanceOverview?.metrics?.visitedToday ?? 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Completed or active sessions today.</p>
        </div>

        {/* Grace Period / Paused */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                10-Day Grace
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{pausedCount}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Pass expired; renewal grace active.</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search athlete by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-dark/50 border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-accent/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-brand-dark/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-text-inverted focus:outline-none focus:border-emerald-accent/50 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused (Grace Period)</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Roster List */}
      {filteredClients.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-dark flex items-center justify-center mx-auto text-text-muted mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-text-inverted">
            {searchTerm || statusFilter ? 'No matching clients found' : 'No clients assigned yet'}
          </h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mt-1">
            {searchTerm || statusFilter
              ? 'Try modifying your search query or status filter.'
              : 'When members select you as their coach and their assignment is confirmed by the admin, their profile and training health cards will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const isPaused = client.status === 'PAUSED';
            const isActive = client.status === 'ACTIVE';

            return (
              <div
                key={client.assignmentId}
                className={`bg-brand-surface border rounded-xl p-5 shadow-sm transition-all hover:border-emerald-accent/30 flex flex-col justify-between ${
                  isPaused
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : isActive
                    ? 'border-brand-border'
                    : 'border-zinc-800 opacity-70'
                }`}
              >
                <div>
                  {/* Client Header & Status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-emerald-accent font-bold text-sm sm:text-base shrink-0">
                        {client.memberName?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-semibold text-text-inverted truncate">
                            {client.memberName}
                          </h4>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                              client.memberGender === 'female'
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            }`}
                          >
                            {client.memberGender === 'female' ? 'Female' : 'Male'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Attendance Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                      {client.isCurrentlyInGym && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          In Gym Now
                        </span>
                      )}
                      {!client.isCurrentlyInGym && client.hasVisitedToday && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Attended Today
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      {isPaused && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Paused (Grace)
                        </span>
                      )}
                      {client.status === 'TERMINATED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Terminated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grace Period Warning Banner */}
                  {isPaused && client.gracePeriodEndsAt && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-300">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Membership pass expired</p>
                        <p className="text-amber-200/80">
                          Grace period ends on{' '}
                          <span className="font-semibold">{formatDateIST(client.gracePeriodEndsAt)}</span>.
                          If no active pass is renewed by then, assignment will auto-terminate.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Passes, Coaching Since & Attendance Consistency */}
                  <div className="mt-4 pt-3 border-t border-brand-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-accent" />
                        Pass Status
                      </p>
                      <p className="text-text-inverted mt-0.5 font-medium">
                        {client.activePassName ? (
                          <span className="text-emerald-400">{client.activePassName}</span>
                        ) : (
                          <span className="text-rose-400">No active pass</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-accent" />
                        Coaching Since
                      </p>
                      <p className="text-text-inverted mt-0.5">
                        {formatDateIST(client.assignedAt)}
                      </p>
                    </div>

                    {client.visitsThisMonth !== null && client.visitsThisMonth !== undefined && (
                      <div className="sm:col-span-2 pt-2 border-t border-brand-border/40 flex items-center justify-between text-xs text-text-muted">
                        <span>
                          Visits This Month: <strong className="text-emerald-400 font-semibold">{client.visitsThisMonth} sessions</strong>
                        </span>
                        {client.lastCheckInTime && (
                          <span className="text-[11px]">
                            Last Visit: <strong className="text-text-inverted">{formatDateIST(client.lastCheckInTime)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Medical Conditions / Health Goals */}
                  {client.healthConditions && (
                    <div className="mt-3 p-2.5 rounded-lg bg-brand-dark/40 border border-brand-border text-xs">
                      <p className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mb-1">
                        <HeartPulse className="w-3 h-3 text-rose-400" />
                        Health & Medical Advisory
                      </p>
                      <p className="text-text-muted leading-relaxed">
                        {client.healthConditions}
                      </p>
                    </div>
                  )}

                  {/* Assignment Notes */}
                  {client.notes && (
                    <div className="mt-2.5 p-2 rounded-lg bg-brand-dark/20 text-xs text-text-muted flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">"{client.notes}"</span>
                    </div>
                  )}
                </div>

                {/* Footer Details & Attendance Action Buttons */}
                <div className="mt-4 pt-3 border-t border-brand-border/40 flex items-center justify-between text-xs text-text-muted">
                  <span>Assignment #{client.assignmentId}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/workouts?memberId=${client.memberId}`)}
                      className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium inline-flex items-center gap-1 transition-colors"
                      title="Manage Athlete Workout Plan"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      Workout
                    </button>
                    <button
                      type="button"
                      onClick={() => openClientAttendance(client)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium inline-flex items-center gap-1 transition-colors"
                      title="Inspect Member Attendance History & Consistency"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => openClientProfile(client)}
                      className="text-text-muted hover:text-text-inverted font-medium transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-xs text-text-muted">
          <span>
            Showing page <strong className="text-text-inverted">{data.pagination.page}</strong> of{' '}
            <strong className="text-text-inverted">{data.pagination.totalPages}</strong> ({data.pagination.total} clients)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.pagination.page <= 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={data.pagination.page >= data.pagination.totalPages || isLoading}
              className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Athlete Profile & Attendance Modal */}
      {selectedClient && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="athlete-profile-modal-title"
          data-testid="athlete-modal-backdrop"
          onClick={() => setSelectedClient(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div
            ref={modalDialogRef}
            tabIndex="-1"
            className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full h-[90vh] sm:h-[540px] max-h-[90dvh] sm:max-h-[540px] p-4 sm:p-6 shadow-2xl flex flex-col focus:outline-none overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border pb-3 shrink-0 gap-3">
              <div className="min-w-0 flex-1">
                <h3 id="athlete-profile-modal-title" className="text-base sm:text-lg font-bold text-text-inverted truncate">
                  Athlete Profile: {selectedClient.memberName}
                </h3>
                <span className="text-xs text-text-muted truncate block">{selectedClient.memberEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-inverted hover:bg-brand-dark/50 border border-transparent hover:border-brand-border transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-brand-border/60 py-2.5 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setClientModalTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  clientModalTab === 'profile'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-text-muted hover:text-text-inverted'
                }`}
              >
                Profile & Health
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientModalTab('attendance');
                  if (!clientAttendance.data && !clientAttendance.isLoading && selectedClient?.memberId) {
                    loadClientAttendanceData(selectedClient.memberId);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  clientModalTab === 'attendance'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-text-muted hover:text-text-inverted'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Attendance & Visits
              </button>
            </div>

            {/* Scrollable Tab Body (uniform height across tabs) */}
            <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-4">
              {clientModalTab === 'profile' ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="min-w-0">
                      <span className="text-text-muted block">Email</span>
                      <span className="text-text-inverted font-medium break-all">{selectedClient.memberEmail}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-text-muted block">Phone</span>
                      <span className="text-text-inverted font-medium">{selectedClient.memberPhone || 'N/A'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-text-muted block">Gender</span>
                      <span className="text-text-inverted font-medium capitalize">{selectedClient.memberGender || 'Not specified'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-text-muted block">Status</span>
                      <span className="font-semibold text-emerald-400">{selectedClient.status}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-text-muted block">Assigned On</span>
                      <span className="text-text-inverted font-medium">{formatDateIST(selectedClient.assignedAt)}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-text-muted block">Emergency Contact</span>
                      <span className="text-text-inverted font-medium break-words">
                        {selectedClient.emergencyContactName ? `${selectedClient.emergencyContactName} (${selectedClient.emergencyContactPhone || 'No phone'})` : 'None'}
                      </span>
                    </div>
                  </div>

                  {selectedClient.healthConditions && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <h5 className="font-semibold text-rose-300 text-xs mb-1 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5" /> Medical Conditions & Pre-existing Injuries
                      </h5>
                      <p className="text-xs text-rose-200/90 leading-relaxed">
                        {selectedClient.healthConditions}
                      </p>
                    </div>
                  )}

                  {selectedClient.notes && (
                    <div className="p-3 rounded-lg bg-brand-dark/50 border border-brand-border">
                      <span className="text-xs text-text-muted block mb-1">Coaching / Onboarding Notes:</span>
                      <p className="text-xs text-text-inverted">{selectedClient.notes}</p>
                    </div>
                  )}

                  {selectedClient.status === 'PAUSED' && selectedClient.gracePeriodEndsAt && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      <span className="font-bold block mb-0.5">Grace Period Expiry:</span>
                      {formatDateIST(selectedClient.gracePeriodEndsAt)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {clientAttendance.isLoading ? (
                    <div className="p-8 text-center text-text-muted flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      Loading client attendance records...
                    </div>
                  ) : clientAttendance.error ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center">
                      {clientAttendance.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* GitHub-Style Attendance Heatmap */}
                      <AttendanceHeatmap
                        heatmap={clientAttendance.data?.heatmap || []}
                        stats={clientAttendance.data?.stats || { totalVisits: 0, visitsThisMonth: 0, currentStreak: 0 }}
                        weeksCount={14}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default TrainerCoachingPage;

