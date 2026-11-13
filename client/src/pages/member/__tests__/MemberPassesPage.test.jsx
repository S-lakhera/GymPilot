import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { MemberPassesPage } from "../MemberPassesPage.jsx";
import { subscriptionApi } from "../../../api/subscriptionApi.js";

vi.mock("../../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn(),
    cancelSubscription: vi.fn(),
  },
}));

describe("MemberPassesPage Component", () => {
  const mockPasses = [
    {
      id: 101,
      plan_name: "CrossFit Elite Monthly",
      category_id: 10,
      category_name: "CrossFit",
      status: "active",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      price_paid: 3200,
      final_amount: 3200,
    },
    {
      id: 102,
      plan_name: "CrossFit Early Renewal",
      category_id: 10,
      category_name: "CrossFit",
      status: "queued",
      start_date: "2026-12-01",
      end_date: "2026-12-31",
      price_paid: 2800,
      final_amount: 2800,
    },
    {
      id: 103,
      plan_name: "Pilates Starter",
      category_id: 20,
      category_name: "Pilates",
      status: "expired",
      start_date: "2026-09-01",
      end_date: "2026-09-30",
      price_paid: 1800,
      final_amount: 1800,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header, counters, and active passes by default", async () => {
    subscriptionApi.listSubscriptions.mockResolvedValueOnce({
      subscriptions: mockPasses,
    });

    render(
      <BrowserRouter>
        <MemberPassesPage />
      </BrowserRouter>
    );

    // Initial loading indicator
    expect(screen.getByText(/loading your passes/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/my gym passes & memberships/i)).toBeInTheDocument();
    });

    // Verify summary metric values
    expect(screen.getAllByText("Active Passes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Queued Renewals")).toBeInTheDocument();
    expect(screen.getByText("Completed & Past")).toBeInTheDocument();
    expect(screen.getByText("Total Invested")).toBeInTheDocument();

    // Verify active pass rendered
    expect(screen.getByText("CrossFit Elite Monthly")).toBeInTheDocument();
    expect(screen.getByText(/renew pass/i)).toBeInTheDocument();
  });

  it("switches to Queued tab and cancels a queued pass with confirmation modal", async () => {
    subscriptionApi.listSubscriptions
      .mockResolvedValueOnce({ subscriptions: mockPasses })
      .mockResolvedValueOnce({
        subscriptions: mockPasses.filter((p) => p.id !== 102),
      });

    subscriptionApi.cancelSubscription.mockResolvedValueOnce({
      message: "Subscription successfully cancelled.",
    });

    render(
      <BrowserRouter>
        <MemberPassesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("CrossFit Elite Monthly")).toBeInTheDocument();
    });

    // Switch to Queued tab
    const queuedTabBtn = screen.getByRole("button", { name: /^queued/i });
    fireEvent.click(queuedTabBtn);

    // Verify queued pass card rendered
    expect(screen.getByText("CrossFit Early Renewal")).toBeInTheDocument();
    expect(screen.getByText(/scheduled to activate automatically/i)).toBeInTheDocument();

    // Click "Cancel Pass" button
    const cancelBtn = screen.getByRole("button", { name: /^cancel pass$/i });
    fireEvent.click(cancelBtn);

    // Verify accessible confirmation dialog opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/cancel queued pass\?/i)).toBeInTheDocument();

    // Confirm cancellation
    const confirmCancelBtn = screen.getByRole("button", { name: /yes, cancel pass/i });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(subscriptionApi.cancelSubscription).toHaveBeenCalledWith(102);
      expect(screen.getByText(/queued pass successfully cancelled/i)).toBeInTheDocument();
    });
  });

  it("switches to Pass History tab and renders past subscriptions table", async () => {
    subscriptionApi.listSubscriptions.mockResolvedValueOnce({
      subscriptions: mockPasses,
    });

    render(
      <BrowserRouter>
        <MemberPassesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("CrossFit Elite Monthly")).toBeInTheDocument();
    });

    // Click Pass History tab
    const historyTabBtn = screen.getByRole("button", { name: /pass history/i });
    fireEvent.click(historyTabBtn);

    // Verify historical pass rendered
    expect(screen.getByText("Pilates Starter")).toBeInTheDocument();
    expect(screen.getByText("Ref #103")).toBeInTheDocument();
    expect(screen.getByText("expired")).toBeInTheDocument();
    expect(screen.getByText(/re-subscribe/i)).toBeInTheDocument();
  });
});
