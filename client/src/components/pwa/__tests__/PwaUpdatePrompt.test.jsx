import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PwaUpdatePrompt } from '../PwaUpdatePrompt.jsx';
import * as pwaHook from '../../../hooks/usePwa.js';

describe('PwaUpdatePrompt Component', () => {
  it('renders null when needRefresh is false', () => {
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      needRefresh: false,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
    });

    const { container } = render(<PwaUpdatePrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders update prompt with action buttons when needRefresh is true', () => {
    const mockUpdateApp = vi.fn();
    const mockDismissUpdate = vi.fn();

    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      needRefresh: true,
      updateApp: mockUpdateApp,
      dismissUpdate: mockDismissUpdate,
    });

    render(<PwaUpdatePrompt />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Update Available')).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: 'Update Now' });
    const laterBtn = screen.getByRole('button', { name: 'Later' });

    fireEvent.click(updateBtn);
    expect(mockUpdateApp).toHaveBeenCalledTimes(1);

    fireEvent.click(laterBtn);
    expect(mockDismissUpdate).toHaveBeenCalledTimes(1);
  });
});
