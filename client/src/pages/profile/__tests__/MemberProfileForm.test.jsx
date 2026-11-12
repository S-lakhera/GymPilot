import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberProfileForm } from '../MemberProfileForm.jsx';

const mockUpdateUserProfile = vi.fn();
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 2, firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@gmail.com', phone: '+91-9876543210' },
    profile: {
      date_of_birth: '1995-04-12',
      gender: 'male',
      emergency_contact_name: 'Pooja Sharma',
      emergency_contact_phone: '+91-9999988888',
      health_conditions: 'None',
    },
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
vi.mock('../../../api/userApi.js', () => ({
  userApi: {
    getProfile: () => mockGetProfile(),
    updateProfile: (data) => mockUpdateProfile(data),
  },
}));

describe('MemberProfileForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asynchronously loads profile and populates fields', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Rahul', lastName: 'Sharma', phone: '+91-9876543210', email: 'rahul.sharma@gmail.com' },
      profile: {
        date_of_birth: '1995-04-12',
        gender: 'male',
        emergency_contact_name: 'Pooja Sharma',
        emergency_contact_phone: '+91-9999988888',
        health_conditions: 'None',
      },
      isProfileComplete: true,
    });

    render(<MemberProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Rahul');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Sharma');
      expect(screen.getByLabelText(/Emergency Contact Name/i)).toHaveValue('Pooja Sharma');
    });
  });

  it('validates co-dependent emergency contact fields', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Rahul', lastName: 'Sharma' },
      profile: {},
      isProfileComplete: false,
    });

    render(<MemberProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Rahul');
    });

    // Enter emergency contact name without phone number
    fireEvent.change(screen.getByLabelText(/Emergency Contact Name/i), {
      target: { value: 'Pooja Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/Emergency Contact Phone/i), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Both emergency contact name and phone number must be provided together/i)
      ).toBeInTheDocument();
    });

    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('submits updated member data successfully and triggers context sync', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Rahul', lastName: 'Sharma' },
      profile: {},
      isProfileComplete: false,
    });

    mockUpdateProfile.mockResolvedValueOnce({
      user: { firstName: 'Rahul', lastName: 'Verma' },
      profile: { gender: 'male' },
      isProfileComplete: true,
    });

    render(<MemberProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Rahul');
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Verma' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Rahul',
          lastName: 'Verma',
        })
      );
      expect(mockUpdateUserProfile).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalled();
    });
  });
});
