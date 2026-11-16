import React, { useState } from 'react';
import { Flame, Calendar, Trophy, Clock } from 'lucide-react';
import { formatDate, formatDuration } from '../../utils/formatters.js';

/**
 * GitHub-Style Attendance Contribution Heatmap Component.
 * Visualizes member gym visits over the past 12-16 weeks as a day-by-day activity grid.
 */
export function AttendanceHeatmap({
  heatmap = [],
  stats = { totalVisits: 0, visitsThisMonth: 0, currentStreak: 0 },
  weeksCount = 16,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Map heatmap records into a quick lookup map by ISO date (YYYY-MM-DD)
  const visitMap = new Map();
  if (Array.isArray(heatmap)) {
    for (const item of heatmap) {
      if (item && item.date) {
        visitMap.set(item.date, item);
      }
    }
  }

  // Generate grid columns (weeks) and rows (days of week: Sun=0 to Sat=6)
  const totalDays = weeksCount * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find ending day of the current week (Saturday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  // Start date for the grid
  const startDate = new Date(endOfWeek);
  startDate.setDate(endOfWeek.getDate() - totalDays + 1);

  const daysGrid = [];
  const curr = new Date(startDate);

  while (curr <= endOfWeek) {
    const isoDate = curr.toISOString().split('T')[0];
    const isFuture = curr > today;
    const visitData = visitMap.get(isoDate);
    const count = visitData ? visitData.count : 0;
    const durationMinutes = visitData ? visitData.durationMinutes : 0;

    daysGrid.push({
      date: isoDate,
      dateObj: new Date(curr),
      dayOfWeek: curr.getDay(),
      count,
      durationMinutes,
      isFuture,
      isToday: curr.getTime() === today.getTime(),
    });

    curr.setDate(curr.getDate() + 1);
  }

  // Group into columns of 7 days (Sunday - Saturday)
  const weeks = [];
  for (let i = 0; i < daysGrid.length; i += 7) {
    weeks.push(daysGrid.slice(i, i + 7));
  }

  // Get color for attendance count
  const getCellColor = (day) => {
    if (day.isFuture) {
      return 'bg-gray-900/40 border border-gray-800/30 opacity-40 cursor-not-allowed';
    }
    if (day.count === 0) {
      return 'bg-gray-800/70 border border-gray-700/30 hover:border-gray-500 transition-colors';
    }
    if (day.count === 1) {
      return 'bg-emerald-600 border border-emerald-500 hover:brightness-110 transition-colors shadow-sm';
    }
    return 'bg-emerald-400 border border-emerald-300 hover:brightness-110 transition-colors shadow-sm';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Header & Streak Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-text-inverted flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Workout Activity & Attendance Heatmap
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Your day-by-day training consistency over the past {weeksCount} weeks.
          </p>
        </div>

        {/* Streak & Consistency Badges */}
        <div className="flex items-center gap-2">
          {stats.currentStreak > 0 ? (
            <span className="px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500 animate-pulse" />
              {stats.currentStreak}-Day Streak!
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-gray-800/80 border border-brand-border text-text-muted text-xs font-medium inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-text-muted" />
              0 Streak
            </span>
          )}

          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            {stats.visitsThisMonth} Visits this month
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col min-w-full">
          {/* Day of week row labels + week columns */}
          <div className="flex gap-1.5">
            {/* Left Day of week labels */}
            <div className="flex flex-col gap-1 pr-1.5 justify-between py-0.5 text-[9px] text-text-muted font-mono select-none">
              <span className="h-3.5 leading-3">Sun</span>
              <span className="h-3.5 leading-3">Mon</span>
              <span className="h-3.5 leading-3">Tue</span>
              <span className="h-3.5 leading-3">Wed</span>
              <span className="h-3.5 leading-3">Thu</span>
              <span className="h-3.5 leading-3">Fri</span>
              <span className="h-3.5 leading-3">Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 rounded-[3px] relative cursor-pointer ${getCellColor(day)} ${
                        day.isToday ? 'ring-1 ring-emerald-300 ring-offset-1 ring-offset-gray-900' : ''
                      }`}
                      title={`${formatDate(day.date)}: ${
                        day.count > 0 ? `${day.count} visit (${formatDuration(day.durationMinutes)})` : 'No visit'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Info Bar & Legend */}
          <div className="flex items-center justify-between pt-3 mt-1 text-[11px] text-text-muted">
            <div className="h-4">
              {hoveredDay ? (
                <span className="text-text-inverted font-medium flex items-center gap-1.5 animate-fade-in">
                  <span className="font-semibold text-emerald-400">
                    {formatDate(hoveredDay.date)}:
                  </span>{' '}
                  {hoveredDay.count > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      {hoveredDay.count} gym session ({formatDuration(hoveredDay.durationMinutes)})
                    </span>
                  ) : hoveredDay.isFuture ? (
                    <span className="text-text-muted/60">Upcoming date</span>
                  ) : (
                    <span>No gym attendance recorded</span>
                  )}
                </span>
              ) : (
                <span className="text-text-muted/70">
                  Hover over any date square to inspect session duration
                </span>
              )}
            </div>

            {/* Color Legend */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-800/80 border border-gray-700/30" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 border border-emerald-500" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceHeatmap;
