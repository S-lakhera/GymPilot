import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WorkoutsDispatcher } from '../WorkoutsDispatcher.jsx';
import { USER_ROLES } from '../../../utils/constants.js';

const mockUseAuth = vi.fn();
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../TrainerWorkoutsPage.jsx', () => ({
  TrainerWorkoutsPage: () => <div data-testid="trainer-workouts-page">Trainer Workouts Desk</div>,
  default: () => <div data-testid="trainer-workouts-page">Trainer Workouts Desk</div>,
}));

vi.mock('../MemberWorkoutsPage.jsx', () => ({
  MemberWorkoutsPage: () => <div data-testid="member-workouts-page">Member Workouts Session</div>,
  default: () => <div data-testid="member-workouts-page">Member Workouts Session</div>,
}));

describe('WorkoutsDispatcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TrainerWorkoutsPage inside TrainerLayout when authenticated as a TRAINER', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: USER_ROLES.TRAINER,
      user: { id: 2, name: 'Coach Sarah' },
    });

    render(
      <MemoryRouter initialEntries={['/workouts']}>
        <Routes>
          <Route path="/workouts" element={<WorkoutsDispatcher />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('trainer-workouts-page')).toBeInTheDocument();
  });

  it('renders MemberWorkoutsPage inside MemberLayout when authenticated as a MEMBER', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: USER_ROLES.MEMBER,
      user: { id: 5, name: 'Rahul Sharma' },
    });

    render(
      <MemoryRouter initialEntries={['/workouts']}>
        <Routes>
          <Route path="/workouts" element={<WorkoutsDispatcher />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('member-workouts-page')).toBeInTheDocument();
  });

  it('redirects to /dashboard when authenticated as an ADMIN', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: USER_ROLES.ADMIN,
      user: { id: 1, name: 'Super Admin' },
    });

    render(
      <MemoryRouter initialEntries={['/workouts']}>
        <Routes>
          <Route path="/workouts" element={<WorkoutsDispatcher />} />
          <Route path="/dashboard" element={<div data-testid="admin-dashboard-redirect">Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('admin-dashboard-redirect')).toBeInTheDocument();
  });
});
