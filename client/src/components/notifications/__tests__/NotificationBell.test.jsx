import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from '../NotificationBell.jsx';
import * as useNotificationsHook from '../../../hooks/useNotifications.js';

vi.mock('../../../hooks/useNotifications.js');

describe('NotificationBell Component', () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockDeleteNotification = vi.fn();
  const mockFetchNotifications = vi.fn();
  const mockFetchUnreadCount = vi.fn();

  const mockNotifications = [
    {
      id: 1,
      type: 'PASS_EXPIRING_7D',
      title: 'Pass Expiring Soon',
      message: 'Your monthly pass expires in 7 days.',
      isRead: false,
      actionUrl: '/passes',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'WORKOUT_PLAN_ASSIGNED',
      title: 'New Plan Assigned',
      message: 'Trainer Alex assigned you a new workout plan.',
      isRead: true,
      actionUrl: '/workouts',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useNotificationsHook, 'useNotifications').mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      total: 2,
      loading: false,
      error: null,
      fetchNotifications: mockFetchNotifications,
      fetchUnreadCount: mockFetchUnreadCount,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
    });
  });

  it('renders bell button and unread count badge', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();

    const badge = screen.getByTestId('unread-badge');
    expect(badge).toHaveTextContent('1');
  });

  it('opens popover dialog on click and displays notification list', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();
    expect(screen.getByText('Pass Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('New Plan Assigned')).toBeInTheDocument();
  });

  it('marks all as read when clicking mark all read button', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllBtn);

    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('filters by unread tab', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    const unreadTab = screen.getByRole('button', { name: /unread \(1\)/i });
    fireEvent.click(unreadTab);

    expect(screen.getByText('Pass Expiring Soon')).toBeInTheDocument();
    expect(screen.queryByText('New Plan Assigned')).not.toBeInTheDocument();
  });

  it('marks unread notification as read and navigates when clicked', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    const unreadCard = screen.getByText('Pass Expiring Soon');
    fireEvent.click(unreadCard);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('closes popover when clicking the close button', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close notifications/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /notifications panel/i })).not.toBeInTheDocument();
  });
});
