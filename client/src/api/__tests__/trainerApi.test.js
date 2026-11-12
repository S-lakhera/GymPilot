import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trainerApi } from '../trainerApi.js';
import { axiosClient } from '../axiosClient.js';

vi.mock('../axiosClient.js', () => ({
  axiosClient: {
    patch: vi.fn(),
  },
}));

describe('trainerApi Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly unpacks nested { trainer } response envelope from backend', async () => {
    axiosClient.patch.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'Trainer profile updated successfully.',
        data: {
          trainer: {
            id: 4,
            firstName: 'Alex',
            lastName: 'Morgan',
            email: 'trainer.alex@gympilot.com',
            phone: '+91-9876543210',
            role: 'trainer',
            isActive: true,
            profile: {
              specialization: 'CrossFit & Strength',
              experienceYears: 6,
              certification: 'ACE Certified',
              bio: 'Passionate trainer',
            },
          },
        },
      },
    });

    const result = await trainerApi.updateTrainerProfile(4, {
      firstName: 'Alex',
      lastName: 'Morgan',
      phone: '+91-9876543210',
      specialization: 'CrossFit & Strength',
    });

    expect(result.user).toEqual({
      id: 4,
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'trainer.alex@gympilot.com',
      phone: '+91-9876543210',
      role: 'trainer',
      isActive: true,
    });
    expect(result.profile.specialization).toBe('CrossFit & Strength');
    expect(result.isProfileComplete).toBe(true);
    expect(result.message).toBe('Trainer profile updated successfully.');
  });
});
