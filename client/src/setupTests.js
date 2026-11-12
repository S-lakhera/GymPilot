import '@testing-library/jest-dom';

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
