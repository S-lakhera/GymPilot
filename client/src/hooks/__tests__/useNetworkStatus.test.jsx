import React from 'react';
import { renderHook, act, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from '../useNetworkStatus.js';
import { ToastContext, ToastProvider } from '../../context/ToastContext.jsx';

describe('useNetworkStatus Hook', () => {
  let originalOnLine;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('initializes with the current navigator.onLine value', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('updates state to offline when window offline event fires', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('updates state to online and displays toast notification on reconnection', () => {
    const mockShowToast = vi.fn();
    const wrapper = ({ children }) => (
      <ToastContext.Provider value={{ showToast: mockShowToast, dismissToast: vi.fn() }}>
        {children}
      </ToastContext.Provider>
    );

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    // Transition: online -> offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);

    // Transition: offline -> online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining('back online'),
      })
    );
  });

  it('triggers exactly one reconnect toast under React StrictMode with real ToastProvider', () => {
    const wrapper = ({ children }) => (
      <React.StrictMode>
        <ToastProvider>{children}</ToastProvider>
      </React.StrictMode>
    );

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    // Transition: online -> offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);

    // Transition: offline -> online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);

    // Assert that the real ToastProvider rendered exactly one reconnect notification
    const toastElements = screen.getAllByText(/You are back online/i);
    expect(toastElements).toHaveLength(1);
  });
});

