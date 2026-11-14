import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary.jsx";

// Component that conditionally throws
function ProblematicChild({ shouldThrow = true, message = "Crash in child" }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Healthy Child Content</div>;
}

// Wrapper that allows toggling throw condition for reset testing
function ResettableContainer({ variant }) {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <div>
      <button onClick={() => setShouldThrow(false)}>Fix Error</button>
      <ErrorBoundary variant={variant}>
        <ProblematicChild shouldThrow={shouldThrow} message="Dynamic test crash" />
      </ErrorBoundary>
    </div>
  );
}

describe("ErrorBoundary Component", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children without degradation when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Smooth Operation</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Smooth Operation")).toBeInTheDocument();
  });

  describe("variant='full' (Application-Level Guard)", () => {
    it("renders full-screen crash recovery view when child component throws", () => {
      render(
        <ErrorBoundary variant="full">
          <ProblematicChild message="Fatal root explosion" />
        </ErrorBoundary>
      );

      expect(
        screen.getByRole("heading", { name: /Something went wrong/i })
      ).toBeInTheDocument();
      expect(screen.getByText("GymPilot System Recovery")).toBeInTheDocument();
      expect(screen.getByText("Fatal root explosion")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reload Application/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });

    it("triggers window.location.reload when 'Reload Application' is clicked", () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary variant="full">
          <ProblematicChild message="Fatal reload test" />
        </ErrorBoundary>
      );

      const reloadBtn = screen.getByRole("button", { name: /Reload Application/i });
      fireEvent.click(reloadBtn);

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it("resets error state when 'Try Again' is clicked after error condition resolves", () => {
      render(<ResettableContainer variant="full" />);

      expect(screen.getByText("Dynamic test crash")).toBeInTheDocument();

      // Fix the underlying error source
      fireEvent.click(screen.getByRole("button", { name: "Fix Error" }));

      // Click boundary's Try Again
      fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));

      expect(screen.getByText("Healthy Child Content")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /Something went wrong/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("variant='content' (Layout & Route-Level Guard)", () => {
    it("renders compact section fallback view without breaking outer layout", () => {
      render(
        <div data-testid="outer-dashboard">
          <header>Persistent Topbar</header>
          <ErrorBoundary variant="content">
            <ProblematicChild message="Section widget crash" />
          </ErrorBoundary>
        </div>
      );

      // Outer elements remain intact
      expect(screen.getByText("Persistent Topbar")).toBeInTheDocument();

      // Section fallback displayed
      expect(
        screen.getByRole("heading", { name: /This section encountered an unexpected error/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Section widget crash")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reload Page/i })).toBeInTheDocument();
    });

    it("recovers from section failure when 'Try Again' is clicked", () => {
      render(<ResettableContainer variant="content" />);

      expect(
        screen.getByRole("heading", { name: /This section encountered an unexpected error/i })
      ).toBeInTheDocument();

      // Fix condition and retry
      fireEvent.click(screen.getByRole("button", { name: "Fix Error" }));
      fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));

      expect(screen.getByText("Healthy Child Content")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /This section encountered an unexpected error/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Custom Fallback", () => {
    it("renders custom fallback function with error and reset", () => {
      render(
        <ErrorBoundary
          fallback={({ error, resetErrorBoundary }) => (
            <div>
              <span>Custom: {error.message}</span>
              <button onClick={resetErrorBoundary}>Custom Reset</button>
            </div>
          )}
        >
          <ProblematicChild message="Custom error propagation" />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom: Custom error propagation")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Custom Reset" })).toBeInTheDocument();
    });
  });
});
