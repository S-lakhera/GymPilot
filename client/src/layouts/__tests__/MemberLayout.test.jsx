import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MemberLayout } from '../MemberLayout.jsx';

vi.mock('../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 1, firstName: 'John', role: 'member' },
    logout: vi.fn(),
  }),
}));

describe('MemberLayout Component', () => {
  it('renders 4 navigation items excluding Coaching', () => {
    render(
      <MemoryRouter>
        <MemberLayout>
          <div>Member Content</div>
        </MemberLayout>
      </MemoryRouter>
    );

    // Verify presence of 4 primary navigation tabs
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Passes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Workouts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);

    // Verify Coaching is NOT rendered in member navigation
    expect(screen.queryByText('Coaching')).not.toBeInTheDocument();
  });
});
