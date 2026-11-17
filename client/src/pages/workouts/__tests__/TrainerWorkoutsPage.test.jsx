import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TrainerWorkoutsPage } from '../TrainerWorkoutsPage.jsx';
import { workoutApi } from '../../../api/workoutApi.js';
import { coachingApi } from '../../../api/coachingApi.js';

vi.mock('../../../api/workoutApi.js', () => ({
  workoutApi: {
    getTrainerPlans: vi.fn(),
    getExercises: vi.fn(),
    getClientPlan: vi.fn(),
    getPlanById: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
  },
}));

vi.mock('../../../api/coachingApi.js', () => ({
  coachingApi: {
    getTrainerRoster: vi.fn(),
  },
}));

vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('TrainerWorkoutsPage Component', () => {
  const mockPlans = [
    {
      id: 201,
      title: 'Strength Progression 4-Day Routine',
      goal: 'Maximal Strength',
      difficulty: 'advanced',
      notes: 'Focus on RPE 8-9 on main lifts.',
      isActive: true,
      memberId: 5,
      memberName: 'Rahul Sharma',
      memberEmail: 'rahul.sharma@gmail.com',
      daysCount: 4,
      totalExercisesCount: 16,
      updatedAt: '2026-11-16T10:00:00Z',
    },
    {
      id: 202,
      title: 'Conditioning & Mobility Split',
      goal: 'Fat Loss',
      difficulty: 'beginner',
      notes: 'Light rest periods.',
      isActive: false,
      memberId: 6,
      memberName: 'Priya Patel',
      memberEmail: 'priya.patel@gmail.com',
      daysCount: 2,
      totalExercisesCount: 8,
      updatedAt: '2026-11-15T10:00:00Z',
    },
  ];

  const mockRoster = {
    assignments: [
      { member_id: 5, memberName: 'Rahul Sharma' },
      { member_id: 6, memberName: 'Priya Patel' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    workoutApi.getExercises.mockResolvedValue([]);
  });

  it('renders workout library header, metrics, and plan cards', async () => {
    workoutApi.getTrainerPlans.mockResolvedValueOnce(mockPlans);
    coachingApi.getTrainerRoster.mockResolvedValueOnce(mockRoster);

    render(
      <MemoryRouter>
        <TrainerWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Workout Library & Regimens')).toBeInTheDocument();
    });

    expect(screen.getByText('Strength Progression 4-Day Routine')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('Conditioning & Mobility Split')).toBeInTheDocument();
    expect(screen.getByText('Priya Patel')).toBeInTheDocument();

    // Check metrics
    expect(screen.getByText('Total Authored Plans')).toBeInTheDocument();
    expect(screen.getByText('Active Client Regimens')).toBeInTheDocument();
  });

  it('filters plans by search query', async () => {
    workoutApi.getTrainerPlans.mockResolvedValueOnce(mockPlans);
    coachingApi.getTrainerRoster.mockResolvedValueOnce(mockRoster);

    render(
      <MemoryRouter>
        <TrainerWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Strength Progression 4-Day Routine')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/filter by plan title/i);
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(screen.queryByText('Strength Progression 4-Day Routine')).not.toBeInTheDocument();
    expect(screen.getByText('Conditioning & Mobility Split')).toBeInTheDocument();
  });

  it('opens workout plan creation modal on click', async () => {
    workoutApi.getTrainerPlans.mockResolvedValueOnce(mockPlans);
    coachingApi.getTrainerRoster.mockResolvedValueOnce(mockRoster);

    render(
      <MemoryRouter>
        <TrainerWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Workout Plan')).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /create workout plan/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Design custom day splits, target sets, and rep prescriptions for your athlete.')).toBeInTheDocument();
  });

  it('loads specific plan by ID when editing an archived plan', async () => {
    workoutApi.getTrainerPlans.mockResolvedValueOnce(mockPlans);
    coachingApi.getTrainerRoster.mockResolvedValueOnce(mockRoster);
    workoutApi.getPlanById.mockResolvedValueOnce({
      id: 202,
      memberId: 6,
      title: 'Conditioning & Mobility Split',
      goal: 'Fat Loss',
      difficulty: 'beginner',
      notes: 'Light rest periods.',
      days: [
        {
          id: 501,
          dayNumber: 1,
          dayName: 'Day 1 - Mobility',
          exercises: [{ exerciseId: '1', customName: 'Stretch', sets: 3, reps: '10', restSeconds: 30 }],
        },
      ],
    });

    render(
      <MemoryRouter>
        <TrainerWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conditioning & Mobility Split')).toBeInTheDocument();
    });

    // Find the edit button for the second plan (id: 202, archived)
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[1]);

    await waitFor(() => {
      expect(workoutApi.getPlanById).toHaveBeenCalledWith(202);
      expect(screen.getByDisplayValue('Conditioning & Mobility Split')).toBeInTheDocument();
    });
  });
});
