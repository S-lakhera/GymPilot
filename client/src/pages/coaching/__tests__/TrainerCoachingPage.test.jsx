import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TrainerCoachingPage } from '../TrainerCoachingPage.jsx';
import { useCoaching } from '../../../hooks/useCoaching.js';
import { attendanceApi } from '../../../api/attendanceApi.js';

vi.mock('../../../hooks/useCoaching.js', () => ({
  useCoaching: vi.fn(),
}));

vi.mock('../../../api/attendanceApi.js', () => ({
  attendanceApi: {
    getTrainerOverview: vi.fn(),
    getClientHistory: vi.fn(),
  },
}));

describe('TrainerCoachingPage Component (Merged Coaching & Attendance)', () => {
  const mockCoachingData = {
    trainerProfile: {
      activeClientsCount: 1,
      maxClients: 10,
      specialization: 'Hypertrophy & Strength',
    },
    metrics: {
      activeClients: 1,
      maxClients: 10,
      capacityPercent: 10,
    },
    assignments: [
      {
        id: 101,
        member_id: 5,
        status: 'ACTIVE',
        start_date: '2026-10-01',
        member_first_name: 'Rahul',
        member_last_name: 'Sharma',
        member_email: 'rahul.sharma@gmail.com',
        member_gender: 'male',
        active_subscriptions: [
          { plan_name: 'Strength Quarterly Pass' },
        ],
      },
    ],
    pagination: {
      page: 1,
      totalPages: 1,
      total: 1,
    },
  };

  const mockAttendanceOverview = {
    clients: [
      {
        memberId: 5,
        isCurrentlyInGym: true,
        hasVisitedToday: true,
        visitsThisMonth: 6,
        totalVisits: 14,
        lastCheckInTime: '2026-11-16T18:00:00Z',
      },
    ],
    metrics: {
      totalClients: 1,
      activeInGymNow: 1,
      visitedToday: 1,
      avgMonthlyVisits: 6,
    },
  };

  const mockClientHistory = {
    heatmap: [{ date: '2026-11-16', count: 1, durationMinutes: 60 }],
    stats: { totalVisits: 14, visitsThisMonth: 6, currentStreak: 3 },
    records: [{ id: 1, check_in_time: '2026-11-16T18:00:00Z' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCoaching.mockReturnValue({
      data: mockCoachingData,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    attendanceApi.getTrainerOverview.mockResolvedValue(mockAttendanceOverview);
    attendanceApi.getClientHistory.mockResolvedValue(mockClientHistory);
  });

  it('renders merged page header, capacity load, and attendance floor metrics', async () => {
    render(
      <MemoryRouter>
        <TrainerCoachingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Coaching Roster & Client Attendance')).toBeInTheDocument();
    expect(screen.getByText('Client Capacity Load')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('In Gym Floor Now')).toBeInTheDocument();
    });
    expect(screen.getByText('Attended Today')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
  });

  it('renders athlete attendance badges and opens attendance heatmap modal without recent visits table', async () => {
    render(
      <MemoryRouter>
        <TrainerCoachingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('In Gym Now')).toBeInTheDocument();
    });

    const attendanceBtn = screen.getByRole('button', { name: /Attendance/i });
    fireEvent.click(attendanceBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByText(/3-Day Streak/i)).toBeInTheDocument();
    });

    // Ensure Recent Gym Visits table is NOT in the document
    expect(screen.queryByText('Recent Gym Visits')).not.toBeInTheDocument();

    // Ensure redundant footer Close button is deleted
    expect(screen.queryByRole('button', { name: /^Close$/i })).not.toBeInTheDocument();
  });

  it('closes athlete modal on backdrop click, top-right X button, and Escape key', async () => {
    render(
      <MemoryRouter>
        <TrainerCoachingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    });

    // 1. Open modal via Athlete Card Profile button
    const profileBtn = screen.getByRole('button', { name: /^Profile$/i });
    fireEvent.click(profileBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Athlete Profile: Rahul Sharma/i)).toBeInTheDocument();

    // 2. Close via top-right X button
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 3. Open again and close via Escape key
    fireEvent.click(profileBtn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 4. Open again and close via backdrop click
    fireEvent.click(profileBtn);
    const backdrop = await screen.findByTestId('athlete-modal-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
