import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OfflineBanner } from '../OfflineBanner.jsx';
import * as networkHook from '../../../hooks/useNetworkStatus.js';

describe('OfflineBanner Component', () => {
  it('renders null when device is online', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });

    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders persistent offline banner when device is offline', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isOnline: false,
      wasOffline: true,
    });

    render(<OfflineBanner />);

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Offline Mode/i);
    expect(banner).toHaveTextContent(/Financial transactions, check-ins, and mutations are paused/i);
  });
});

