import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AdminAttendancePage } from '../AdminAttendancePage.jsx';
import { attendanceApi } from '../../../api/attendanceApi.js';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { ToastContext } from '../../../context/ToastContext.jsx';

vi.mock('../../../api/attendanceApi.js', () => ({
  attendanceApi: {
    getAdminOverview: vi.fn(),
    searchMembers: vi.fn(),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
  },
}));

// Mock recharts ResponsiveContainer
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container" style={{ width: 300, height: 100 }}>
        {children}
      </div>
    ),
  };
});

describe('AdminAttendancePage Component', () => {
  const mockOverview = {
    stats: {
      currentlyInGym: 2,
      totalVisitsToday: 5,
      completedVisitsToday: 3,
    },
    trend: [
      { date: '2026-11-10', day: 'Tue', count: 4 },
      { date: '2026-11-11', day: 'Wed', count: 6 },
      { date: '2026-11-12', day: 'Thu', count: 5 },
      { date: '2026-11-13', day: 'Fri', count: 7 },
      { date: '2026-11-14', day: 'Sat', count: 8 },
      { date: '2026-11-15', day: 'Sun', count: 3 },
      { date: '2026-11-16', day: 'Mon', count: 5 },
    ],
    currentlyInGym: [
      {
        id: 101,
        member_id: 5,
        member_first_name: 'Rahul',
        member_last_name: 'Sharma',
        member_email: 'rahul.sharma@gmail.com',
        check_in_time: '2026-11-16 10:00:00',
        elapsed_minutes: 45,
        pass_status_at_checkin: 'ACTIVE_PASS',
        plan_name: 'Strength Quarterly Pass',
        notes: 'Training on main floor',
      },
    ],
    logs: [
      {
        id: 101,
        member_id: 5,
        member_first_name: 'Rahul',
        member_last_name: 'Sharma',
        member_email: 'rahul.sharma@gmail.com',
        check_in_time: '2026-11-16 10:00:00',
        check_out_time: null,
        duration_minutes: null,
        status: 'CHECKED_IN',
        pass_status_at_checkin: 'ACTIVE_PASS',
        plan_name: 'Strength Quarterly Pass',
        recorded_by_first_name: 'Vikramaditya',
        recorded_by_last_name: 'Singhania',
      },
    ],
    pagination: {
      page: 1,
      limit: 15,
      total: 1,
      totalPages: 1,
    },
  };

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: { id: 1, email: 'admin@gympilot.com', role: 'admin' },
            role: 'admin',
            isAuthenticated: true,
          }}
        >
          <ToastContext.Provider value={{ showToast: vi.fn() }}>
            <AdminAttendancePage />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    attendanceApi.getAdminOverview.mockResolvedValue(mockOverview);
  });

  it('renders header, 4 metrics cards, and currently in gym table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Attendance & Check-In Desk')).toBeInTheDocument();
      expect(screen.getByText('Currently in Gym')).toBeInTheDocument();
      expect(screen.getByText('Total Visits Today')).toBeInTheDocument();
      expect(screen.getByText('Completed Visits')).toBeInTheDocument();
      expect(screen.getByText('7-Day Trend')).toBeInTheDocument();
    });

    // Check stats values
    expect(screen.getByText('2')).toBeInTheDocument(); // currentlyInGym
    expect(screen.getAllByText('Rahul Sharma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Strength Quarterly Pass').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers check-out action when clicking Check Out button', async () => {
    attendanceApi.checkOut.mockResolvedValue({ id: 101, status: 'CHECKED_OUT', duration_minutes: 45 });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => {
      expect(attendanceApi.checkOut).toHaveBeenCalledWith(101, { checkOutTime: null, notes: null });
    });
  });

  it('searches members and displays suggestions for check-in', async () => {
    attendanceApi.searchMembers.mockResolvedValue([
      {
        id: 6,
        name: 'Priya Patel',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@gmail.com',
        phone: '9866600006',
        isActive: true,
        isCurrentlyInGym: false,
        hasActivePass: true,
        activePlanName: 'Yoga Zen',
      },
    ]);

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Type member name, email or phone/i);
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    await waitFor(() => {
      expect(attendanceApi.searchMembers).toHaveBeenCalledWith('Priya');
      expect(screen.getByText('Priya Patel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark present/i })).toBeInTheDocument();
    });
  });
});
