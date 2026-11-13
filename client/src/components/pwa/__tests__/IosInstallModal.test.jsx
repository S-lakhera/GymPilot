import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IosInstallModal } from '../IosInstallModal.jsx';
import * as pwaHook from '../../../hooks/usePwa.js';

describe('IosInstallModal Component', () => {
  it('renders null when showIosModal is false', () => {
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      showIosModal: false,
      setShowIosModal: vi.fn(),
    });

    const { container } = render(<IosInstallModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders instructions dialog when showIosModal is true', () => {
    const mockSetShow = vi.fn();
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      showIosModal: true,
      setShowIosModal: mockSetShow,
    });

    render(<IosInstallModal />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Install GymPilot on iOS/i })).toBeInTheDocument();
    expect(screen.getByText(/Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close installation guide/i });
    fireEvent.click(closeBtn);
    expect(mockSetShow).toHaveBeenCalledWith(false);
  });

  it('closes dialog when pressing Escape key', () => {
    const mockSetShow = vi.fn();
    vi.spyOn(pwaHook, 'usePwa').mockReturnValue({
      showIosModal: true,
      setShowIosModal: mockSetShow,
    });

    render(<IosInstallModal />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockSetShow).toHaveBeenCalledWith(false);
  });
});
