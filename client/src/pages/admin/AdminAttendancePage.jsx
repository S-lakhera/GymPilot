import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  LogOut,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAttendance } from '../../hooks/useAttendance.js';
import { attendanceApi } from '../../api/attendanceApi.js';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
} from '../../utils/formatters.js';

export function AdminAttendancePage() {
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'yesterday' | '7days' | 'all'
  const [page, setPage] = useState(1);

  // Compute effective query dates
  const todayIso = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayIso = yesterdayDate.toISOString().split('T')[0];
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgoIso = sevenDaysAgoDate.toISOString().split('T')[0];

  let queryDate = null;
  let queryStartDate = null;
  let queryEndDate = null;

  if (dateFilter === 'today') {
    queryDate = todayIso;
  } else if (dateFilter === 'yesterday') {
    queryDate = yesterdayIso;
  } else if (dateFilter === '7days') {
    queryStartDate = sevenDaysAgoIso;
    queryEndDate = todayIso;
  }

  const {
    data,
    stats,
    trend,
    currentlyInGym,
    logs,
    pagination,
    isLoading,
    isMutating,
    error,
    refresh,
    checkIn,
    checkOut,
    updateRecord,
    deleteRecord,
  } = useAttendance({
    date: queryDate,
    startDate: queryStartDate,
    endDate: queryEndDate,
    search: searchTerm,
    status: statusFilter,
    page,
    limit: 15,
  });

  // Quick check-in desk states
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Soft Pass Validation Modal state
  const [softPassModal, setSoftPassModal] = useState({
    isOpen: false,
    member: null,
    overrideNote: '',
  });

  // Edit record modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    record: null,
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    record: null,
  });

  // Debounced member search for check-in desk
  useEffect(() => {
    if (!searchMemberQuery.trim()) {
      setMemberSuggestions([]);
      setIsSearchingMembers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMembers(true);
      try {
        const results = await attendanceApi.searchMembers(searchMemberQuery);
        setMemberSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to search members:', err);
      } finally {
        setIsSearchingMembers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchMemberQuery]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Mark Present initiation
  const handleInitiateCheckIn = async (member) => {
    setShowSuggestions(false);

    // If member already in gym, alert
    if (member.isCurrentlyInGym) {
      return;
    }

    // Try check-in
    const result = await checkIn({
      memberId: member.id,
      overrideConfirmed: false,
    });

    // If soft override is required
    if (result.requiresOverride) {
      setSoftPassModal({
        isOpen: true,
        member,
        overrideNote: '',
      });
    } else if (result.success) {
      setSearchMemberQuery('');
    }
  };

  // Confirm soft override check-in
  const handleConfirmSoftOverride = async () => {
    if (!softPassModal.member) return;

    const result = await checkIn({
      memberId: softPassModal.member.id,
      overrideConfirmed: true,
      overrideNote: softPassModal.overrideNote.trim() || 'Front-desk administrative override',
    });

    if (result.success) {
      setSoftPassModal({ isOpen: false, member: null, overrideNote: '' });
      setSearchMemberQuery('');
    }
  };

  // Open edit modal
  const handleOpenEdit = (rec) => {
    // Format into datetime-local format YYYY-MM-DDTHH:mm
    const toInputVal = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditModal({
      isOpen: true,
      record: rec,
      checkInTime: toInputVal(rec.check_in_time),
      checkOutTime: toInputVal(rec.check_out_time),
      notes: rec.notes || '',
    });
  };

  // Submit edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.record) return;

    await updateRecord(editModal.record.id, {
      checkInTime: editModal.checkInTime || undefined,
      checkOutTime: editModal.checkOutTime || null,
      notes: editModal.notes,
    });

    setEditModal({ isOpen: false, record: null, checkInTime: '', checkOutTime: '', notes: '' });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.record) return;
    await deleteRecord(deleteModal.record.id);
    setDeleteModal({ isOpen: false, record: null });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
              Attendance & Check-In Desk
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Desk
            </span>
          </div>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            Real-time floor occupancy, rapid member check-in, and daily attendance logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refresh()}
          disabled={isLoading || isMutating}
          className="px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-inverted text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-brand-surface/80 transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 4 Core Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Currently In Gym */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Currently in Gym
            </span>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="absolute w-3 h-3 rounded-full bg-emerald-400/30 animate-ping" />
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-inverted tracking-tight">
              {stats.currentlyInGym}
            </div>
            <p className="text-xs text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
              Active training sessions right now
            </p>
          </div>
        </div>

        {/* Card 2: Total Visits Today */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Total Visits Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-inverted tracking-tight">
              {stats.totalVisitsToday}
            </div>
            <p className="text-xs text-text-muted mt-1">
              Total member check-ins recorded
            </p>
          </div>
        </div>

        {/* Card 3: Completed Visits Today */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Completed Visits
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-inverted tracking-tight">
              {stats.completedVisitsToday}
            </div>
            <p className="text-xs text-text-muted mt-1">
              Sessions checked out with duration
            </p>
          </div>
        </div>

        {/* Card 4: 7-Day Trend Chart */}
        <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">
              7-Day Trend
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 border border-gray-700 px-2 py-1 rounded text-[11px] text-white shadow-lg">
                          <p className="font-semibold">{payload[0].payload.day}</p>
                          <p className="text-emerald-400">{payload[0].value} visits</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Check-In Desk Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-surface to-brand-surface/90 border border-brand-border shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-base font-bold text-text-inverted flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Quick Member Check-In Desk
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Search any registered member by name, email, or phone to mark them present instantly.
          </p>

          <div ref={searchContainerRef} className="relative mt-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                onFocus={() => {
                  if (memberSuggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Type member name, email or phone (e.g. Rahul, Priya)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-950/60 border border-brand-border text-text-inverted placeholder:text-text-muted/60 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchMemberQuery && (
                <button
                  type="button"
                  onClick={() => setSearchMemberQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-inverted"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-brand-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                {isSearchingMembers ? (
                  <div className="p-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Searching members...
                  </div>
                ) : memberSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted">
                    No active members matching &quot;{searchMemberQuery}&quot;
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {memberSuggestions.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                            {m.firstName?.[0] || 'M'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text-inverted">
                                {m.name}
                              </span>
                              {m.hasActivePass ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  {m.activePlanName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  No Active Pass
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                              {m.email} {m.phone ? `• ${m.phone}` : ''}
                            </p>
                          </div>
                        </div>

                        <div>
                          {m.isCurrentlyInGym ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              In Gym
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInitiateCheckIn(m)}
                              disabled={isMutating}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-60 inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Mark Present
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Currently in Gym Live Roster */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-text-inverted">
              Currently on the Gym Floor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              {currentlyInGym.length} Active
            </span>
          </div>
          <span className="text-xs text-text-muted hidden sm:inline">
            Click &quot;Check Out&quot; when member leaves
          </span>
        </div>

        {currentlyInGym.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Clock className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
            <p className="text-sm font-medium">No members currently checked in.</p>
            <p className="text-xs text-text-muted/70 mt-1">
              Use the check-in search desk above to record new member entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/40 text-text-muted border-b border-brand-border uppercase font-medium text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Elapsed</th>
                  <th className="py-3 px-4">Pass Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {currentlyInGym.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-inverted text-sm">
                        {item.member_first_name} {item.member_last_name}
                      </div>
                      <div className="text-text-muted text-[11px]">{item.member_email}</div>
                    </td>
                    <td className="py-3 px-4 text-text-inverted font-mono">
                      {formatTime(item.check_in_time)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-medium">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        {formatDuration(item.elapsed_minutes || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.pass_status_at_checkin === 'ACTIVE_PASS' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.plan_name || 'Active Pass'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={item.override_note}>
                          Override ({item.pass_status_at_checkin === 'EXPIRED_PASS' ? 'Expired' : 'No Pass'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-xs truncate" title={item.notes || ''}>
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => checkOut(item.id)}
                        disabled={isMutating}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance History & Logs Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-brand-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-inverted">
                Attendance History & Logs
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Complete historical audit of gym visits, duration, and staff entries.
              </p>
            </div>

            {/* Date filter pills */}
            <div className="flex items-center gap-1.5 bg-gray-950/60 p-1 rounded-xl border border-brand-border self-start sm:self-auto">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Past 7 Days' },
                { id: 'all', label: 'All Records' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setDateFilter(pill.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    dateFilter === pill.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-inverted'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter logs by member name or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-950/50 border border-brand-border text-xs text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-gray-950/50 border border-brand-border text-xs text-text-inverted focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="CHECKED_IN">Checked In (Active)</option>
                <option value="CHECKED_OUT">Checked Out (Completed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Calendar className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
            <p className="text-sm font-medium">No attendance records found.</p>
            <p className="text-xs text-text-muted/70 mt-1">
              Try adjusting your date or search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/40 text-text-muted border-b border-brand-border uppercase font-medium text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & In</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Pass / Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-text-inverted">
                        {formatDate(log.check_in_time)}
                      </div>
                      <div className="text-text-muted font-mono text-[11px]">
                        {formatTime(log.check_in_time)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-inverted">
                        {log.member_first_name} {log.member_last_name}
                      </div>
                      <div className="text-text-muted text-[11px]">{log.member_email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {log.check_out_time ? formatTime(log.check_out_time) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {log.duration_minutes ? (
                        <span className="text-emerald-400 font-medium">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.pass_status_at_checkin === 'ACTIVE_PASS' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.plan_name || 'Active Pass'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title={log.override_note || ''}>
                          Override
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'CHECKED_IN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-300">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {log.recorded_by_first_name} {log.recorded_by_last_name}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(log)}
                          className="p-1 rounded text-text-muted hover:text-text-inverted hover:bg-gray-800 transition-colors"
                          title="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, record: log })}
                          className="p-1 rounded text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-brand-border flex items-center justify-between text-xs text-text-muted">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-brand-border hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-brand-border hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Soft Pass Validation Alert Modal */}
      {/* ========================================================================= */}
      {softPassModal.isOpen && softPassModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-brand-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-inverted">
                  Active Membership Pass Required
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-text-inverted">
                    {softPassModal.member.name}
                  </span>{' '}
                  does not hold an active membership pass. To admit this member, confirm an administrative check-in override.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Override Reason / Front-Desk Note
              </label>
              <textarea
                value={softPassModal.overrideNote}
                onChange={(e) =>
                  setSoftPassModal((prev) => ({ ...prev, overrideNote: e.target.value }))
                }
                placeholder="e.g. Single-day trial pass granted, Payment pending, Manager approved..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-gray-950 border border-brand-border text-xs text-text-inverted placeholder:text-text-muted/50 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSoftPassModal({ isOpen: false, member: null, overrideNote: '' })}
                disabled={isMutating}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-text-muted hover:text-text-inverted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSoftOverride}
                disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
              >
                {isMutating ? 'Confirming...' : 'Confirm & Mark Present'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit Attendance Record Modal */}
      {/* ========================================================================= */}
      {editModal.isOpen && editModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-gray-900 border border-brand-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-inverted flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Edit Attendance Record
              </h3>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, record: null, checkInTime: '', checkOutTime: '', notes: '' })}
                className="text-text-muted hover:text-text-inverted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Member: <span className="font-semibold text-text-inverted">{editModal.record.member_first_name} {editModal.record.member_last_name}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Check-In Time
                </label>
                <input
                  type="datetime-local"
                  value={editModal.checkInTime}
                  onChange={(e) => setEditModal((p) => ({ ...p, checkInTime: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl bg-gray-950 border border-brand-border text-xs text-text-inverted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Check-Out Time (Leave empty if still in gym)
                </label>
                <input
                  type="datetime-local"
                  value={editModal.checkOutTime}
                  onChange={(e) => setEditModal((p) => ({ ...p, checkOutTime: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-gray-950 border border-brand-border text-xs text-text-inverted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Notes
                </label>
                <textarea
                  value={editModal.notes}
                  onChange={(e) => setEditModal((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-gray-950 border border-brand-border text-xs text-text-inverted focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, record: null, checkInTime: '', checkOutTime: '', notes: '' })}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-text-muted hover:text-text-inverted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {isMutating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {deleteModal.isOpen && deleteModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-brand-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-text-inverted">
                Delete Attendance Record
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Are you sure you want to permanently delete this attendance entry for{' '}
                <span className="font-semibold text-text-inverted">
                  {deleteModal.record.member_first_name} {deleteModal.record.member_last_name}
                </span>{' '}
                on {formatDate(deleteModal.record.check_in_time)}?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, record: null })}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-text-muted hover:text-text-inverted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {isMutating ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAttendancePage;
