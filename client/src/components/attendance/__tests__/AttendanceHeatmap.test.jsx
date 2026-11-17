import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AttendanceHeatmap } from '../AttendanceHeatmap.jsx';

describe('AttendanceHeatmap Component', () => {
  const mockStats = {
    totalVisits: 12,
    visitsThisMonth: 5,
    currentStreak: 4,
  };

  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const mockHeatmap = [
    { date: todayStr, count: 1, durationMinutes: 75 },
  ];

  it('renders heading and single clean inline streak metric', () => {
    render(<AttendanceHeatmap heatmap={mockHeatmap} stats={mockStats} weeksCount={16} />);

    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText(/4-Day Streak!/i)).toBeInTheDocument();
  });

  it('correctly maps today date and renders session tooltip', () => {
    render(<AttendanceHeatmap heatmap={mockHeatmap} stats={mockStats} weeksCount={16} />);

    // Look for element whose title includes "1 session" and formatted duration
    const sessionCells = document.querySelectorAll('[title*="1 session"]');
    expect(sessionCells.length).toBeGreaterThan(0);
    expect(sessionCells[0].getAttribute('title')).toContain('1 session');
    expect(sessionCells[0].getAttribute('title')).toContain('1h 15m');
  });

  it('renders month labels and day labels', () => {
    render(<AttendanceHeatmap heatmap={mockHeatmap} stats={mockStats} weeksCount={16} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });
});
