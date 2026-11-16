import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { AttendanceHeatmap } from '../attendance/AttendanceHeatmap.jsx';
import { Clock, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters.js';

export function MemberAttendanceSection() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getMyHistory({ limit: 5, days: 126 }); // 18 weeks (126 days)
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load attendance history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Loading workout consistency & attendance records...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm flex items-center justify-between text-xs text-text-muted">
        <span>Could not load attendance activity.</span>
        <button
          type="button"
          onClick={fetchHistory}
          className="text-emerald-400 hover:underline font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { records = [], heatmap = [], stats = { totalVisits: 0, visitsThisMonth: 0, currentStreak: 0 } } =
    data || {};

  return (
    <div className="space-y-4">
      {/* GitHub-style Heatmap */}
      <AttendanceHeatmap heatmap={heatmap} stats={stats} weeksCount={18} />

      {/* Recent Visits Mini Table */}
      {records.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-3">
            <h4 className="text-sm font-bold text-text-inverted flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Gym Visits
            </h4>
            <span className="text-xs text-text-muted">
              Lifetime: <strong className="text-text-inverted">{stats.totalVisits}</strong> sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-text-muted uppercase text-[10px] tracking-wider border-b border-brand-border/40">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Check-In</th>
                  <th className="py-2 px-3">Check-Out</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Pass / Plan</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-800/20 transition-colors">
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
                        <span className="text-emerald-400 font-medium">
                          {formatDuration(rec.duration_minutes)}
                        </span>
                      ) : (
                        <span className="text-text-muted">In Progress</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {rec.plan_name || 'Gym Access'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {rec.status === 'CHECKED_IN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Now
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-300">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberAttendanceSection;
