import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaProvider } from '../PwaContext.jsx';
import { usePwa } from '../../hooks/usePwa.js';
import { useRegisterSW } from 'virtual:pwa-register/react';

function TestConsumer() {
  const {
    needRefresh,
    updateApp,
    dismissUpdate,
    isInstallable,
    isInstalled,
    isIos,
    installApp,
    dismissInstall,
    showIosModal,
    setShowIosModal,
  } = usePwa();

  return (
    <div>
      <div data-testid="installed">{String(isInstalled)}</div>
      <div data-testid="installable">{String(isInstallable)}</div>
      <div data-testid="need-refresh">{String(needRefresh)}</div>
      <div data-testid="is-ios">{String(isIos)}</div>
      <div data-testid="show-ios-modal">{String(showIosModal)}</div>
      <button onClick={installApp}>Trigger Install</button>
      <button onClick={dismissInstall}>Dismiss Install</button>
      <button onClick={updateApp}>Trigger Update</button>
      <button onClick={dismissUpdate}>Dismiss Update</button>
      <button onClick={() => setShowIosModal(true)}>Open iOS Modal</button>
    </div>
  );
}

describe('PwaContext & PwaProvider', () => {
  let mockUpdateServiceWorker;
  let mockSetNeedRefresh;

  beforeEach(() => {
    mockUpdateServiceWorker = vi.fn();
    mockSetNeedRefresh = vi.fn();

    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [false, mockSetNeedRefresh],
      updateServiceWorker: mockUpdateServiceWorker,
    });
  });

  it('provides default initial PWA state', () => {
    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    );

    expect(screen.getByTestId('installed').textContent).toBe('false');
    expect(screen.getByTestId('installable').textContent).toBe('false');
    expect(screen.getByTestId('need-refresh').textContent).toBe('false');
  });

  it('captures beforeinstallprompt event and marks app as installable', async () => {
    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    );

    const mockPrompt = vi.fn();
    const beforeInstallEvent = new Event('beforeinstallprompt');
    beforeInstallEvent.prompt = mockPrompt;
    beforeInstallEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(beforeInstallEvent);
    });

    expect(screen.getByTestId('installable').textContent).toBe('true');

    // Trigger install flow
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Install' }));
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(screen.getByTestId('installed').textContent).toBe('true');
  });

  it('handles appinstalled event and updates installed state', () => {
    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    );

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(screen.getByTestId('installed').textContent).toBe('true');
    expect(screen.getByTestId('installable').textContent).toBe('false');
  });

  it('triggers updateApp to reload with the new service worker', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, mockSetNeedRefresh],
      updateServiceWorker: mockUpdateServiceWorker,
    });

    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    );

    expect(screen.getByTestId('need-refresh').textContent).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Update' }));
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Update' }));
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
  });

  it('allows dismissing install CTA', () => {
    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    );

    const beforeInstallEvent = new Event('beforeinstallprompt');
    beforeInstallEvent.prompt = vi.fn();
    act(() => {
      window.dispatchEvent(beforeInstallEvent);
    });

    expect(screen.getByTestId('installable').textContent).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Install' }));
    expect(screen.getByTestId('installable').textContent).toBe('false');
  });
});
