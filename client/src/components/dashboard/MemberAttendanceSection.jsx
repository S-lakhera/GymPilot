import React, { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { AttendanceHeatmap } from '../attendance/AttendanceHeatmap.jsx';
import { RefreshCw } from 'lucide-react';

/**
 * Member Attendance & Consistency Heatmap Section for Member Dashboard.
 * Visualizes workout consistency as an authentic GitHub-style activity grid.
 */
export function MemberAttendanceSection({ weeksCount = 16 }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestSeqRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getMyHistory({ limit: 1, days: weeksCount * 7 });
      if (currentSeq === requestSeqRef.current) {
        setData(res);
        setError(null);
      }
    } catch (err) {
      if (currentSeq === requestSeqRef.current) {
        setError(err.message || 'Failed to load attendance activity.');
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [weeksCount]);

  useEffect(() => {
    fetchHistory();
    return () => {
      requestSeqRef.current++;
    };
  }, [fetchHistory]);

  if (isLoading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm text-center h-full flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          Loading workout consistency heatmap...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm flex items-center justify-between text-xs text-text-muted h-full">
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

  const { heatmap = [], stats = { totalVisits: 0, visitsThisMonth: 0, currentStreak: 0 } } =
    data || {};

  return (
    <div className="h-full">
      <AttendanceHeatmap heatmap={heatmap} stats={stats} weeksCount={weeksCount} />
    </div>
  );
}

export default MemberAttendanceSection;
