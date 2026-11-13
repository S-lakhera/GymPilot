import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Vite PWA virtual registration hook for jsdom test suite
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

// Polyfill ResizeObserver for Recharts in jsdom environment
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock SVG Element methods if missing in jsdom
if (typeof window !== 'undefined' && window.SVGElement) {
  if (!window.SVGElement.prototype.getBBox) {
    window.SVGElement.prototype.getBBox = () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  }
}
