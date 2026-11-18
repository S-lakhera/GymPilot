import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  Send,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  User,
  Ticket,
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDate } from '../../utils/formatters.js';

export function AdminExpirationsDesk() {
  const { showToast } = useToast();

  // Data states
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    expiringWindow: 0,
    expiring7Days: 0,
    expiring3Days: 0,
    expiredCount: 0,
    remindersSentCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [windowDays, setWindowDays] = useState(7);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'expiring', 'expired'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getAdminExpirationsQueue({
        windowDays,
        status: statusFilter,
        page,
        limit: 20,
        search: searchTerm,
      });

      setItems(data.items || []);
      if (data.metrics) setMetrics(data.metrics);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to load expirations queue.',
      });
    } finally {
      setLoading(false);
    }
  }, [windowDays, statusFilter, page, searchTerm, showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Handle global expiration sync
  const handleSyncExpirations = async () => {
    setIsSyncing(true);
    try {
      const result = await notificationApi.syncExpirations();
      const stats = result?.stats || {};
      showToast({
        type: 'success',
        message: `Sync complete: ${stats.expiredSubscriptions || 0} expired passes updated, ${(stats.expiring7DaysCount || 0) + (stats.expiring3DaysCount || 0)} expiration reminders dispatched.`,
      });
      await fetchQueue();
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to synchronize pass expirations.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle manual per-member reminder dispatch
  const handleSendReminder = async (subId) => {
    setSendingReminderId(subId);
    try {
      const res = await notificationApi.sendManualReminder(subId);
      showToast({
        type: 'success',
        message: res?.message || 'Renewal reminder sent successfully.',
      });

      // Optimistically update row
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === subId) {
            return {
              ...item,
              remindersCount: (Number(item.remindersCount) || 0) + 1,
              lastReminderSentAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );
      setMetrics((prev) => ({
        ...prev,
        remindersSentCount: prev.remindersSentCount + 1,
      }));
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to send renewal reminder.',
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Expirations Desk & Renewal Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Proactively monitor expiring membership passes, grace periods, and automated reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncExpirations}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Expirations...' : 'Run Expiration Sync & Reminders'}</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Expiring 7 Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Expiring in 7 Days
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {metrics.expiring7Days}
            </span>
            <span className="text-xs text-slate-400">members</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Scheduled for 7-day reminder alerts</p>
        </div>

        {/* Card 2: Expiring 3 Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Expiring in 3 Days
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {metrics.expiring3Days}
            </span>
            <span className="text-xs text-slate-400">urgent</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Imminent pass expiry window</p>
        </div>

        {/* Card 3: Expired Passes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Expired Active
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {metrics.expiredCount}
            </span>
            <span className="text-xs text-slate-400">passes</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Requires renewal / coach grace period</p>
        </div>

        {/* Card 4: Reminders Sent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Reminders Sent
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {metrics.remindersSentCount}
            </span>
            <span className="text-xs text-slate-400">total</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Automated & manual alerts dispatched</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search member, email, pass..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Pills & Window Select */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('expiring');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'expiring'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expiring Soon
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('expired');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'expired'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expired
            </button>
          </div>

          {/* Window Dropdown */}
          <select
            value={windowDays}
            onChange={(e) => {
              setWindowDays(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value={7}>Window: 7 Days</option>
            <option value={14}>Window: 14 Days</option>
            <option value={30}>Window: 30 Days</option>
          </select>
        </div>
      </div>

      {/* Renewal Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Plan & Category</th>
                <th className="px-5 py-3.5">End Date</th>
                <th className="px-5 py-3.5">Status & Remaining</th>
                <th className="px-5 py-3.5">Reminders</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading renewal queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No subscriptions found matching current filters.
                  </td>
                </tr>
              ) : (
                items.map((sub) => {
                  const isExpired = sub.daysRemaining < 0;
                  const isCritical = !isExpired && sub.daysRemaining <= 3;
                  const isWarning = !isExpired && sub.daysRemaining <= 7;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Member Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
                            {sub.memberName?.[0] || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{sub.memberName}</p>
                            <p className="text-xs text-slate-400">{sub.memberEmail}</p>
                            {sub.memberPhone && (
                              <p className="text-[11px] text-slate-500">{sub.memberPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-medium text-slate-200">{sub.planName}</span>
                        </div>
                        {sub.categoryName && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {sub.categoryName}
                          </span>
                        )}
                      </td>

                      {/* End Date */}
                      <td className="px-5 py-4">
                        <span className="text-slate-300 font-medium">{formatDate(sub.endDate)}</span>
                      </td>

                      {/* Days Remaining & Status Badge */}
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Expired ({Math.abs(sub.daysRemaining)}d ago)
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {sub.daysRemaining} {sub.daysRemaining === 1 ? 'day' : 'days'} left
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            {sub.daysRemaining} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {sub.daysRemaining} days left
                          </span>
                        )}
                      </td>

                      {/* Reminders History */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-xs font-semibold text-slate-300">
                            {sub.remindersCount > 0 ? `${sub.remindersCount} sent` : 'No reminders'}
                          </span>
                          {sub.lastReminderSentAt && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Last: {formatDate(sub.lastReminderSentAt)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSendReminder(sub.id)}
                          disabled={sendingReminderId === sub.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition disabled:opacity-50"
                        >
                          <Send className={`w-3.5 h-3.5 ${sendingReminderId === sub.id ? 'animate-pulse' : ''}`} />
                          <span>{sendingReminderId === sub.id ? 'Sending...' : 'Send Reminder'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
            <span>
              Showing {items.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminExpirationsDesk;
