import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordForm } from '../ChangePasswordForm.jsx';

const mockClearLocalSession = vi.fn();
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    clearLocalSession: mockClearLocalSession,
  }),
}));

const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockChangePassword = vi.fn();
vi.mock('../../../api/authApi.js', () => ({
  authApi: {
    changePassword: (data) => mockChangePassword(data),
  },
}));

describe('ChangePasswordForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three password inputs and submit button', () => {
    render(
      <BrowserRouter>
        <ChangePasswordForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/^Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Password & Re-authenticate/i })).toBeInTheDocument();
  });

  it('validates password mismatch on submit', async () => {
    render(
      <BrowserRouter>
        <ChangePasswordForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^Current Password/i), { target: { value: 'OldPassword@123' } });
    fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'NewPassword@123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), { target: { value: 'DifferentPassword@123' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password & Re-authenticate/i }));

    await waitFor(() => {
      expect(screen.getByText(/New passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('submits change password, excludes confirmPassword, and clears local session', async () => {
    mockChangePassword.mockResolvedValueOnce({ message: 'Password changed successfully' });

    render(
      <BrowserRouter>
        <ChangePasswordForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/^Current Password/i), { target: { value: 'OldPassword@123' } });
    fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'NewSecretPass@2026' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), { target: { value: 'NewSecretPass@2026' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password & Re-authenticate/i }));

    await waitFor(() => {
      // Must exclude confirmPassword from payload!
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword@123',
        newPassword: 'NewSecretPass@2026',
      });
      // Must invoke clearLocalSession without API logout!
      expect(mockClearLocalSession).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalled();
    });
  });
});
