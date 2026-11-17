import React, { useState } from 'react';
import { Flame, Calendar, Trophy, CheckCircle } from 'lucide-react';
import { formatDate, formatDuration } from '../../utils/formatters.js';

/**
 * Formats a Date object to local YYYY-MM-DD avoiding any UTC timezone conversion shift.
 *
 * @param {Date} d
 * @returns {string}
 */
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GitHub-Style Attendance Contribution Heatmap Component.
 * Minimalist, decluttered activity grid designed to pair seamlessly side-by-side with Gym Pass Card.
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
        const dateKey = typeof item.date === 'string' ? item.date.split('T')[0] : formatLocalDate(new Date(item.date));
        visitMap.set(dateKey, item);
      }
    }
  }

  // Calculate local boundaries
  const totalDays = weeksCount * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatLocalDate(today);

  // Find ending day of the current week (Saturday) in local time
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  // Start date for the grid (always starts on a Sunday)
  const startDate = new Date(endOfWeek);
  startDate.setDate(endOfWeek.getDate() - totalDays + 1);

  const daysGrid = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);

  while (curr <= endOfWeek) {
    const isoDate = formatLocalDate(curr);
    const isFuture = curr.getTime() > today.getTime();
    const isToday = isoDate === todayStr;
    const visitData = visitMap.get(isoDate);
    const count = visitData ? visitData.count : 0;
    const durationMinutes = visitData ? visitData.durationMinutes : 0;
    const dayOfWeek = curr.getDay();

    daysGrid.push({
      date: isoDate,
      dateObj: new Date(curr),
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      count,
      durationMinutes,
      isFuture,
      isToday,
    });

    curr.setDate(curr.getDate() + 1);
  }

  // Group into columns of 7 days (Sunday=0 to Saturday=6)
  const weeks = [];
  for (let i = 0; i < daysGrid.length; i += 7) {
    weeks.push(daysGrid.slice(i, i + 7));
  }

  // Compute month labels positioned above the week where the month begins
  const monthLabels = [];
  let lastLabeledMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstDay = week[0]?.dateObj;
    if (firstDay) {
      const monthIndex = firstDay.getMonth();
      if (monthIndex !== lastLabeledMonth && (wIdx === 0 || wIdx - (monthLabels[monthLabels.length - 1]?.col || -5) >= 3)) {
        monthLabels.push({
          col: wIdx,
          name: MONTH_NAMES[monthIndex],
        });
        lastLabeledMonth = monthIndex;
      }
    }
  });

  // Get color for attendance count (GitHub intensity ramp)
  const getCellColor = (day) => {
    if (day.isFuture) {
      return 'invisible pointer-events-none';
    }
    if (day.count === 0) {
      return 'bg-brand-surface/80 border border-brand-border/80 hover:border-gray-500 transition-colors';
    }
    if (day.count === 1) {
      return 'bg-emerald-600/90 border border-emerald-500 hover:brightness-125 transition-all shadow-sm';
    }
    return 'bg-emerald-400 border border-emerald-300 hover:brightness-125 transition-all shadow-sm shadow-emerald-500/20';
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm space-y-4 h-full flex flex-col justify-between">
      {/* Top Header Area: Single Clean Row */}
      <div className="flex items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
        <h3 className="text-base font-bold text-text-inverted flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Attendance
        </h3>

        {/* Single Clean Inline Metric */}
        {stats.currentStreak > 0 ? (
          <span className="px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500 animate-pulse" />
            {stats.currentStreak}-Day Streak!
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            {stats.visitsThisMonth} Visits this month
          </span>
        )}
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-1 flex-1 flex flex-col justify-center">
        <div className="inline-flex flex-col min-w-full">
          {/* Month labels header row */}
          <div className="flex gap-1 pl-8 mb-1.5 text-[10px] text-text-muted font-mono select-none h-4">
            {weeks.map((_, wIdx) => {
              const label = monthLabels.find((m) => m.col === wIdx);
              return (
                <div key={wIdx} className="w-3.5 sm:w-4 flex-shrink-0 text-left">
                  {label ? label.name : ''}
                </div>
              );
            })}
          </div>

          {/* Day of week row labels + week columns */}
          <div className="flex gap-1.5">
            {/* Left Day of week labels (GitHub style: Mon, Wed, Fri only for clean spacing) */}
            <div className="flex flex-col gap-1 pr-1.5 text-[10px] text-text-muted font-mono select-none w-6 flex-shrink-0">
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none" />
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none text-text-secondary">Mon</div>
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none" />
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none text-text-secondary">Wed</div>
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none" />
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none text-text-secondary">Fri</div>
              <div className="h-3.5 sm:h-4 flex items-center justify-end leading-none" />
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1 flex-shrink-0">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => !day.isFuture && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] relative cursor-pointer ${getCellColor(day)} ${
                        day.isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-brand-surface z-10' : ''
                      }`}
                      title={
                        day.isFuture
                          ? ''
                          : `${day.dayName}, ${formatDate(day.date)}: ${
                              day.count > 0 ? `${day.count} session (${formatDuration(day.durationMinutes)})` : 'No visit'
                            }`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area: Clean minimal legend on bottom right, with optional hover detail on left */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-brand-border/40 text-[11px] text-text-muted min-h-[1.75rem]">
        <div className="flex items-center">
          {hoveredDay && hoveredDay.count > 0 && (
            <span className="text-text-inverted font-medium flex items-center gap-1.5 animate-fade-in text-xs">
              <span className="font-semibold text-emerald-400">
                {hoveredDay.dayName}, {formatDate(hoveredDay.date)}:
              </span>{' '}
              <span className="text-emerald-300 font-semibold inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {hoveredDay.count} session ({formatDuration(hoveredDay.durationMinutes)})
              </span>
            </span>
          )}
          {hoveredDay && hoveredDay.count === 0 && !hoveredDay.isFuture && (
            <span className="text-text-muted font-medium flex items-center gap-1.5 animate-fade-in text-xs">
              <span className="text-text-secondary">
                {hoveredDay.dayName}, {formatDate(hoveredDay.date)}:
              </span>{' '}
              No attendance
            </span>
          )}
        </div>

        {/* Minimal Color Legend (aligned to bottom-right) */}
        <div className="flex items-center gap-1.5 text-[10px] ml-auto">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-surface/80 border border-brand-border/80" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/90 border border-emerald-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default AttendanceHeatmap;
