import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CoachingDispatcher } from '../CoachingDispatcher.jsx';
import { USER_ROLES, ROUTES } from '../../../utils/constants.js';

let mockAuthRole = USER_ROLES.MEMBER;

vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    role: mockAuthRole,
    user: { id: 1, firstName: 'Test', role: mockAuthRole },
    logout: vi.fn(),
  }),
}));

vi.mock('../AdminCoachingPage.jsx', () => ({
  default: () => <div data-testid="admin-coaching-page">Admin Coaching Page</div>,
}));

vi.mock('../TrainerCoachingPage.jsx', () => ({
  default: () => <div data-testid="trainer-coaching-page">Trainer Coaching Page</div>,
}));

describe('CoachingDispatcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects member to /workouts when accessing /coaching', async () => {
    mockAuthRole = USER_ROLES.MEMBER;

    render(
      <MemoryRouter initialEntries={[ROUTES.COACHING]}>
        <Routes>
          <Route path={ROUTES.COACHING} element={<CoachingDispatcher />} />
          <Route path={ROUTES.WORKOUTS} element={<div data-testid="workouts-destination">Workouts Workspace</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('workouts-destination')).toBeInTheDocument();
  });

  it('renders Admin Coaching Page when user has admin role', async () => {
    mockAuthRole = USER_ROLES.ADMIN;

    render(
      <MemoryRouter initialEntries={[ROUTES.COACHING]}>
        <Routes>
          <Route path={ROUTES.COACHING} element={<CoachingDispatcher />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('admin-coaching-page')).toBeInTheDocument();
  });

  it('renders Trainer Coaching Page when user has trainer role', async () => {
    mockAuthRole = USER_ROLES.TRAINER;

    render(
      <MemoryRouter initialEntries={[ROUTES.COACHING]}>
        <Routes>
          <Route path={ROUTES.COACHING} element={<CoachingDispatcher />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('trainer-coaching-page')).toBeInTheDocument();
  });
});
