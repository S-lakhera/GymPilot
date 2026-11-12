import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../LoginPage.jsx';

// Mock useAuth
const mockLogin = vi.fn();
const mockClearSessionNotice = vi.fn();

vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    login: mockLogin,
    sessionExpiredMessage: null,
    clearSessionExpiredNotice: mockClearSessionNotice,
  }),
}));

// Mock useToast
const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with inputs and submit button', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays validation error when submitting empty fields', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/^Password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Show password/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /Hide password/i });
    fireEvent.click(hideBtn);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits credentials when valid', async () => {
    mockLogin.mockResolvedValueOnce({ firstName: 'TestAdmin', role: 'admin' });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'admin@gympilot.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@gympilot.com',
        password: 'Password@123',
      });
      expect(mockShowToast).toHaveBeenCalled();
    });
  });
});
