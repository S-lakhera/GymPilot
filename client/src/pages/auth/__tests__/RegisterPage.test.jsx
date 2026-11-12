import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from '../RegisterPage.jsx';

const mockRegister = vi.fn();
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast.js', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all registration fields and submit button', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Registration/i })).toBeInTheDocument();
  });

  it('enforces password minimum length of 6 characters', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits valid registration data', async () => {
    mockRegister.mockResolvedValueOnce({ firstName: 'John', role: 'member' });

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+91-9876543210' } });

    fireEvent.click(screen.getByRole('button', { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password@123',
        phone: '+91-9876543210',
      });
      expect(mockShowToast).toHaveBeenCalled();
    });
  });
});
