import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MemberWorkoutsPage } from '../MemberWorkoutsPage.jsx';
import { workoutApi } from '../../../api/workoutApi.js';
import { coachingApi } from '../../../api/coachingApi.js';

vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

vi.mock('../../../api/workoutApi.js', () => ({
  workoutApi: {
    getMyPlan: vi.fn(),
  },
}));

vi.mock('../../../api/coachingApi.js', () => ({
  coachingApi: {
    getMemberStatus: vi.fn(),
    getTrainersWithCapacity: vi.fn(),
    requestTrainer: vi.fn(),
    cancelRequest: vi.fn(),
  },
}));

describe('MemberWorkoutsPage Component', () => {
  const mockPlan = {
    id: 10,
    title: 'Hypertrophy 3-Day Push/Pull/Legs Split',
    goal: 'Muscle Gain & Strength Foundation',
    difficulty: 'intermediate',
    notes: 'Focus on 2-second negative eccentric tempo on compound movements.',
    trainerName: 'Alex Fernandes',
    days: [
      {
        id: 101,
        dayNumber: 1,
        dayName: 'Day 1 - Push Focus',
        warmupNotes: '5 mins rowing + shoulder mobility',
        exercises: [
          {
            id: 1001,
            exerciseName: 'Barbell Bench Press',
            muscleGroup: 'chest',
            sets: 4,
            reps: '8-10',
            restSeconds: 90,
            notes: 'Pyramid weight on sets 3 & 4',
          },
          {
            id: 1002,
            exerciseName: 'Incline Dumbbell Press',
            muscleGroup: 'chest',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            notes: '30-degree incline',
          },
        ],
      },
      {
        id: 102,
        dayNumber: 2,
        dayName: 'Day 2 - Pull Focus',
        warmupNotes: '5 mins jump rope',
        exercises: [
          {
            id: 1003,
            exerciseName: 'Deadlift',
            muscleGroup: 'back',
            sets: 3,
            reps: '5',
            restSeconds: 120,
            notes: 'Conventional stance',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    coachingApi.getMemberStatus.mockResolvedValue({ currentAssignment: null, pendingRequest: null });
    coachingApi.getTrainersWithCapacity.mockResolvedValue([]);
  });

  it('renders clean empty state with connect coach button when member has no plan assigned', async () => {
    workoutApi.getMyPlan.mockResolvedValueOnce(null);
    coachingApi.getMemberStatus.mockResolvedValueOnce({ currentAssignment: null, pendingRequest: null });

    render(
      <MemoryRouter>
        <MemberWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Workout Plan Assigned Yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Connect With a Personal Coach')).toBeInTheDocument();
  });

  it('renders pending coaching request and cancels it on button click', async () => {
    workoutApi.getMyPlan.mockResolvedValue(null);
    coachingApi.getMemberStatus.mockResolvedValueOnce({
      currentAssignment: null,
      pendingRequest: {
        id: 77,
        trainerName: 'Sarah Khan',
        trainerGender: 'female',
        trainerSpecialization: 'Hatha & Vinyasa Yoga',
        requestedAt: '2026-11-15T10:00:00.000Z',
        notes: 'Interested in core flexibility',
      },
    });
    coachingApi.cancelRequest.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <MemberWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coaching Request Under Review')).toBeInTheDocument();
    });

    expect(screen.getByText('Pending Admin Approval')).toBeInTheDocument();
    expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
    expect(screen.getByText('Hatha & Vinyasa Yoga')).toBeInTheDocument();
    expect(screen.getByText('"Interested in core flexibility"')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel request/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(coachingApi.cancelRequest).toHaveBeenCalledWith(77);
    });
  });

  it('renders assigned coach card on workouts page when member has an active coach', async () => {
    workoutApi.getMyPlan.mockResolvedValueOnce(null);
    coachingApi.getMemberStatus.mockResolvedValueOnce({
      currentAssignment: {
        id: 1,
        trainerName: 'Alex Fernandes',
        trainerGender: 'male',
        status: 'ACTIVE',
        specialization: 'Strength & Hypertrophy',
        experienceYears: 5,
        assignedAt: '2026-10-01',
        trainerEmail: 'trainer.alex@gympilot.com',
        trainerPhone: '+91-9822200002',
        certifications: 'CSCS, ACE Certified Coach',
      },
    });

    render(
      <MemoryRouter>
        <MemberWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alex Fernandes')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Coach')).toBeInTheDocument();
    expect(screen.getByText('Strength & Hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('CSCS')).toBeInTheDocument();
    expect(screen.getByText('trainer.alex@gympilot.com')).toBeInTheDocument();
    expect(screen.getByText('+91-9822200002')).toBeInTheDocument();
    expect(screen.getByText('Workout Plan in Preparation')).toBeInTheDocument();
  });

  it('renders active workout plan, coach details, day switcher, and toggles checklist item', async () => {
    workoutApi.getMyPlan.mockResolvedValueOnce(mockPlan);

    render(
      <MemoryRouter>
        <MemberWorkoutsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hypertrophy 3-Day Push/Pull/Legs Split')).toBeInTheDocument();
    });

    // Check coach & goal
    expect(screen.getByText('Alex Fernandes')).toBeInTheDocument();
    expect(screen.getByText('Goal: Muscle Gain & Strength Foundation')).toBeInTheDocument();
    expect(screen.getByText('Day 1 - Push Focus')).toBeInTheDocument();
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText('4 Sets')).toBeInTheDocument();
    expect(screen.getByText('8-10 Reps')).toBeInTheDocument();

    // Toggle exercise checkbox
    const benchPressCard = screen.getByText('Barbell Bench Press').closest('div[class*="cursor-pointer"]');
    expect(benchPressCard).toBeInTheDocument();

    // Initially 0 of 2 complete (0%)
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Click to complete
    fireEvent.click(benchPressCard);
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Switch to Day 2
    const day2Tab = screen.getByText('Day 2 - Pull Focus');
    fireEvent.click(day2Tab);

    await waitFor(() => {
      expect(screen.getByText('Deadlift')).toBeInTheDocument();
    });
  });
});
