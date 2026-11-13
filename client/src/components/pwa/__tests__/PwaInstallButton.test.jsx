import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PwaInstallButton } from '../PwaInstallButton.jsx';
import * as pwaHook from '../../../hooks/usePwa.js';

describe('PwaInstallButton Component', () => {
  it('renders null when app is not installable', () => {
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      isInstallable: false,
      installApp: vi.fn(),
    });

    const { container } = render(<PwaInstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders button and triggers installApp when clicked', () => {
    const mockInstallApp = vi.fn();
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      isInstallable: true,
      installApp: mockInstallApp,
    });

    render(<PwaInstallButton />);

    const button = screen.getByRole('button', { name: /Install GymPilot App/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Install App')).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockInstallApp).toHaveBeenCalledTimes(1);
  });

  it('renders compact variant without full text label', () => {
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      isInstallable: true,
      installApp: vi.fn(),
    });

    render(<PwaInstallButton compact />);

    const button = screen.getByRole('button', { name: /Install GymPilot App/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Install App')).not.toBeInTheDocument();
  });
});
