import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TrainerAttendancePage } from '../TrainerAttendancePage.jsx';
import { attendanceApi } from '../../../api/attendanceApi.js';

vi.mock('../../../api/attendanceApi.js', () => ({
  attendanceApi: {
    getTrainerOverview: vi.fn(),
    getClientHistory: vi.fn(),
  },
}));

describe('TrainerAttendancePage Component', () => {
  const mockOverview = {
    clients: [
      {
        assignmentId: 101,
        memberId: 5,
        assignmentStatus: 'ACTIVE',
        coachingSince: '2026-10-01',
        firstName: 'Rahul',
        lastName: 'Sharma',
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '+91 98765 43210',
        activePlanName: 'Strength Quarterly Pass',
        isCurrentlyInGym: true,
        hasVisitedToday: true,
        visitsThisMonth: 6,
        totalVisits: 14,
        lastCheckInTime: '2026-11-16T18:00:00Z',
        lastDurationMinutes: null,
      },
    ],
    metrics: {
      totalClients: 1,
      activeInGymNow: 1,
      visitedToday: 1,
      avgMonthlyVisits: 6,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    attendanceApi.getTrainerOverview.mockResolvedValue(mockOverview);
  });

  it('renders athlete attendance tracker overview with metrics', async () => {
    render(
      <BrowserRouter>
        <TrainerAttendancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Assigned Athletes Attendance')).toBeInTheDocument();
    });

    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getAllByText('In Gym Now').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Strength Quarterly Pass')).toBeInTheDocument();
    expect(screen.getByText('6 sessions')).toBeInTheDocument();
  });
});
