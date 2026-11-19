import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminExpirationsDesk } from '../AdminExpirationsDesk.jsx';
import { notificationApi } from '../../../api/notificationApi.js';
import * as toastHook from '../../../hooks/useToast.js';

vi.mock('../../../api/notificationApi.js');
vi.mock('../../../hooks/useToast.js');

describe('AdminExpirationsDesk Component', () => {
  const mockShowToast = vi.fn();

  const mockQueueResponse = {
    items: [
      {
        id: 101,
        userId: 5,
        memberName: 'Rahul Sharma',
        memberEmail: 'rahul.sharma@gmail.com',
        memberPhone: '+91 9876543210',
        planId: 1,
        planName: 'Strength Monthly Pass',
        categoryName: 'Strength',
        startDate: '2026-10-25',
        endDate: '2026-11-25',
        status: 'active',
        daysRemaining: 7,
        remindersCount: 1,
        lastReminderSentAt: '2026-11-18T05:00:00.000Z',
      },
      {
        id: 102,
        userId: 6,
        memberName: 'Priya Patel',
        memberEmail: 'priya.patel@gmail.com',
        memberPhone: '+91 9876543211',
        planId: 2,
        planName: 'Cardio Blast Pass',
        categoryName: 'Cardio',
        startDate: '2026-10-15',
        endDate: '2026-11-15',
        status: 'expired',
        daysRemaining: -3,
        remindersCount: 2,
        lastReminderSentAt: '2026-11-15T05:00:00.000Z',
      },
    ],
    metrics: {
      expiringWindow: 5,
      expiring7Days: 3,
      expiring3Days: 2,
      expiredCount: 4,
      remindersSentCount: 12,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toastHook, 'useToast').mockReturnValue({
      showToast: mockShowToast,
      dismissToast: vi.fn(),
    });
    vi.spyOn(notificationApi, 'getAdminExpirationsQueue').mockResolvedValue(mockQueueResponse);
    vi.spyOn(notificationApi, 'syncExpirations').mockResolvedValue({
      stats: {
        expiredSubscriptions: 2,
        expiring7DaysCount: 3,
        expiring3DaysCount: 1,
      },
    });
    vi.spyOn(notificationApi, 'sendManualReminder').mockResolvedValue({
      success: true,
      message: 'Reminder sent successfully.',
    });
  });

  it('renders page header, metrics cards, and table queue', async () => {
    render(<AdminExpirationsDesk />);

    expect(screen.getByText('Expirations Desk & Renewal Queue')).toBeInTheDocument();
    expect(screen.getByText('Run Expiration Sync & Reminders')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      expect(screen.getByText('Priya Patel')).toBeInTheDocument();
    });

    expect(screen.getByText('Strength Monthly Pass')).toBeInTheDocument();
    expect(screen.getByText('7 days left')).toBeInTheDocument();
    expect(screen.getByText('Expired (3d ago)')).toBeInTheDocument();
  });

  it('triggers manual expiration sync and displays success toast', async () => {
    render(<AdminExpirationsDesk />);

    const syncButton = screen.getByText('Run Expiration Sync & Reminders');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(notificationApi.syncExpirations).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Sync complete'),
        })
      );
    });
  });

  it('sends manual reminder when clicking Send Reminder button on a member row', async () => {
    render(<AdminExpirationsDesk />);

    await waitFor(() => {
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    });

    const reminderButtons = screen.getAllByRole('button', { name: /send reminder/i });
    fireEvent.click(reminderButtons[0]);

    await waitFor(() => {
      expect(notificationApi.sendManualReminder).toHaveBeenCalledWith(101);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Reminder sent successfully.',
        })
      );
    });
  });

  it('filters queue when switching status tabs', async () => {
    render(<AdminExpirationsDesk />);

    const expiredTab = screen.getByRole('button', { name: 'Expired' });
    fireEvent.click(expiredTab);

    await waitFor(() => {
      expect(notificationApi.getAdminExpirationsQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'expired',
        })
      );
    });
  });
});
