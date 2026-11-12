import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminProfileForm } from '../AdminProfileForm.jsx';

const mockUpdateUserProfile = vi.fn();
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@gympilot.com', phone: '+91-9999999999', role: 'admin' },
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

describe('AdminProfileForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asynchronously loads administrator profile and populates fields', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Admin', lastName: 'Master', phone: '+91-9999999999', email: 'admin@gympilot.com', role: 'admin' },
      profile: null,
      isProfileComplete: true,
    });

    render(<AdminProfileForm />);

    expect(screen.getByText(/Loading administrator profile.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Admin');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Master');
      expect(screen.getByLabelText(/Phone Number/i)).toHaveValue('+91-9999999999');
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('admin@gympilot.com');
    });
  });

  it('submits updated admin profile successfully and synchronizes AuthContext', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Admin', lastName: 'Initial', phone: '+91-9999999999', email: 'admin@gympilot.com', role: 'admin' },
      profile: null,
      isProfileComplete: true,
    });

    mockUpdateProfile.mockResolvedValueOnce({
      user: { id: 1, firstName: 'Super', lastName: 'Admin', phone: '+91-8888888888', email: 'admin@gympilot.com', role: 'admin' },
      profile: null,
      isProfileComplete: true,
      message: 'Profile updated successfully',
    });

    render(<AdminProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Admin');
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Super' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Admin' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+91-8888888888' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+91-8888888888',
      });
      expect(mockUpdateUserProfile).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });
  });

  it('handles API error on update and displays error banner', async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: { firstName: 'Admin', lastName: 'User', phone: '+91-9999999999', email: 'admin@gympilot.com', role: 'admin' },
      profile: null,
      isProfileComplete: true,
    });

    mockUpdateProfile.mockRejectedValueOnce({
      message: 'Database connection failed',
      code: 'DB_ERROR',
    });

    render(<AdminProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Admin');
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'NewAdmin' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
  });
});
