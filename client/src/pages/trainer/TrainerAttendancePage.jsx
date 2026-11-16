import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Flame,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { AttendanceHeatmap } from '../../components/attendance/AttendanceHeatmap.jsx';
import { formatDateIST, formatDate, formatTime, formatDuration } from '../../utils/formatters.js';

/**
 * Trainer Client Attendance Workspace.
 * Allows trainers to monitor assigned athlete gym attendance, floor presence, and workout consistency.
 */
export function TrainerAttendancePage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_GYM' | 'VISITED_TODAY' | 'NOT_TODAY'

  // Selected client for detailed attendance inspection
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState({ data: null, isLoading: false, error: null });

  const fetchOverview = async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await attendanceApi.getTrainerOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load athlete attendance overview.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const openClientDetail = async (client) => {
    setSelectedClient(client);
    setClientHistory({ data: null, isLoading: true, error: null });

    try {
      const history = await attendanceApi.getClientHistory(client.memberId, { limit: 15, days: 112 });
      setClientHistory({ data: history, isLoading: false, error: null });
    } catch (err) {
      setClientHistory({
        data: null,
        isLoading: false,
        error: err.message || 'Failed to load athlete attendance history.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-28 bg-brand-surface border border-brand-border rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-brand-surface border border-brand-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-brand-surface border border-brand-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-inverted">Failed to Load Client Attendance</h2>
        <p className="text-xs text-text-muted max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={() => fetchOverview()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-brand-dark rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const { clients = [], metrics = {} } = data || {};

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = client.fullName?.toLowerCase().includes(q);
      const matchEmail = client.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // Status filter match
    if (statusFilter === 'IN_GYM') return client.isCurrentlyInGym;
    if (statusFilter === 'VISITED_TODAY') return client.hasVisitedToday;
    if (statusFilter === 'NOT_TODAY') return !client.hasVisitedToday;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Workspace Header */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <CalendarCheck className="w-3.5 h-3.5" />
              Athlete Attendance Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-inverted tracking-tight">
            Assigned Athletes Attendance
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            Monitor workout frequency, floor presence, and training consistency for your coaching roster.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchOverview(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-text-inverted text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-brand-surface/80 transition-colors disabled:opacity-60"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 4 Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned Clients */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Assigned Athletes</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-inverted mt-2">{metrics.totalClients || 0}</p>
          <span className="text-[11px] text-text-muted mt-1 block">Active coaching roster</span>
        </div>

        {/* Active on Gym Floor Now */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">In Gym Floor Now</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{metrics.activeInGymNow || 0}</p>
          <span className="text-[11px] text-text-muted mt-1 block">Currently checked in</span>
        </div>

        {/* Checked In Today */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Attended Today</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-inverted mt-2">{metrics.visitedToday || 0}</p>
          <span className="text-[11px] text-text-muted mt-1 block">Completed or ongoing visits</span>
        </div>

        {/* Average Monthly Visits */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Avg Monthly Visits</span>
            <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-inverted mt-2">{metrics.avgMonthlyVisits || 0}</p>
          <span className="text-[11px] text-text-muted mt-1 block">Sessions / athlete this month</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search athlete by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-brand-dark/50 border border-brand-border rounded-lg text-xs text-text-inverted placeholder:text-text-muted focus:outline-none focus:border-emerald-accent/60"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Athletes' },
            { id: 'IN_GYM', label: 'In Gym Now' },
            { id: 'VISITED_TODAY', label: 'Visited Today' },
            { id: 'NOT_TODAY', label: 'Not Visited Today' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-muted hover:text-text-inverted hover:bg-brand-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Athlete Attendance List */}
      {filteredClients.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <h3 className="text-base font-bold text-text-inverted">No Athletes Match the Filter</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {clients.length === 0
              ? 'You do not have any active or paused coaching clients assigned to your roster yet.'
              : 'Try clearing your search query or switching filters to see athlete attendance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.assignmentId}
              className="bg-brand-surface border border-brand-border hover:border-brand-border/80 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
            >
              {/* Athlete Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                    {client.firstName?.[0] || 'A'}
                    {client.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-inverted leading-tight">
                      {client.fullName}
                    </h3>
                    <p className="text-xs text-text-muted">{client.email}</p>
                  </div>
                </div>

                {/* Today Status Badge */}
                {client.isCurrentlyInGym ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    In Gym Now
                  </span>
                ) : client.hasVisitedToday ? (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Attended Today
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-gray-800/80 border border-brand-border text-text-muted text-xs font-medium">
                    Not Today
                  </span>
                )}
              </div>

              {/* Status details & metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-brand-dark/40 border border-brand-border/60 text-xs">
                <div>
                  <span className="text-text-muted text-[11px] block">This Month</span>
                  <span className="font-bold text-text-inverted mt-0.5 block">
                    {client.visitsThisMonth} sessions
                  </span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Lifetime</span>
                  <span className="font-bold text-text-inverted mt-0.5 block">
                    {client.totalVisits} sessions
                  </span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Active Plan</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block truncate" title={client.activePlanName || 'None'}>
                    {client.activePlanName || 'No active pass'}
                  </span>
                </div>
              </div>

              {/* Last Session Info */}
              <div className="text-xs text-text-muted flex items-center justify-between">
                <span>
                  Last Visit:{' '}
                  <strong className="text-text-inverted">
                    {client.lastCheckInTime ? formatDateIST(client.lastCheckInTime) : 'Never'}
                  </strong>
                </span>
                {client.lastDurationMinutes ? (
                  <span className="font-mono text-emerald-400">
                    ({formatDuration(client.lastDurationMinutes)})
                  </span>
                ) : null}
              </div>

              {/* Footer Inspect Action */}
              <div className="pt-3 border-t border-brand-border/40 flex items-center justify-between">
                <span className="text-[11px] text-text-muted capitalize">
                  Assignment: <strong className="text-text-inverted">{client.assignmentStatus.toLowerCase()}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => openClientDetail(client)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect Heatmap & Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Athlete Attendance Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-inverted">
                    {selectedClient.fullName}
                  </h3>
                  {selectedClient.isCurrentlyInGym && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      In Gym Now
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedClient.email} • {selectedClient.activePlanName || 'No active pass'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="text-text-muted hover:text-text-inverted text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            {clientHistory.isLoading ? (
              <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Loading athlete attendance records & heatmap...
              </div>
            ) : clientHistory.error ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-300">
                {clientHistory.error}
              </div>
            ) : (
              <div className="space-y-5">
                {/* GitHub-Style Heatmap */}
                <AttendanceHeatmap
                  heatmap={clientHistory.data?.heatmap || []}
                  stats={clientHistory.data?.stats || { totalVisits: 0, visitsThisMonth: 0, currentStreak: 0 }}
                  weeksCount={16}
                />

                {/* Recent Visits Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-inverted uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Recent Gym Visits History
                  </h4>

                  {(!clientHistory.data?.records || clientHistory.data.records.length === 0) ? (
                    <p className="text-xs text-text-muted italic py-4 text-center">
                      No gym attendance sessions recorded for this athlete yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-brand-border/60 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-brand-dark/50 text-text-muted text-[10px] uppercase tracking-wider border-b border-brand-border/60">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Check-In</th>
                            <th className="py-2.5 px-3">Check-Out</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/40">
                          {clientHistory.data.records.map((rec) => (
                            <tr key={rec.id} className="hover:bg-brand-dark/30 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-text-inverted">
                                {formatDate(rec.check_in_time)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-text-muted">
                                {formatTime(rec.check_in_time)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-text-muted">
                                {rec.check_out_time ? formatTime(rec.check_out_time) : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {rec.duration_minutes ? (
                                  <span className="text-emerald-400 font-semibold">
                                    {formatDuration(rec.duration_minutes)}
                                  </span>
                                ) : (
                                  <span className="text-amber-400 font-semibold">In Progress</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {rec.status === 'CHECKED_IN' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                                    Active Now
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-[11px]">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-brand-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-brand-surface border border-brand-border hover:bg-brand-surface/80 text-text-inverted rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerAttendancePage;
