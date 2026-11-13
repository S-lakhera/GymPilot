import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePasses } from "../usePasses.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";

vi.mock("../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn(),
    cancelSubscription: vi.fn(),
  },
}));

describe("usePasses hook", () => {
  const mockPasses = [
    {
      id: 1,
      plan_name: "Pro Strength 30",
      category_id: 1,
      category_name: "Strength",
      status: "active",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      price_paid: 2500,
    },
    {
      id: 2,
      plan_name: "Pro Strength Renewal",
      category_id: 1,
      category_name: "Strength",
      status: "queued",
      start_date: "2026-12-01",
      end_date: "2026-12-31",
      price_paid: 2500,
    },
    {
      id: 3,
      plan_name: "Yoga 10",
      category_id: 2,
      category_name: "Yoga",
      status: "expired",
      start_date: "2026-10-01",
      end_date: "2026-10-10",
      price_paid: 1000,
    },
    {
      id: 4,
      plan_name: "Cardio Blitz",
      category_id: 3,
      category_name: "Cardio",
      status: "cancelled",
      start_date: "2026-10-15",
      end_date: "2026-11-15",
      price_paid: 1500,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches subscriptions and partitions into active, queued, and past passes", async () => {
    subscriptionApi.listSubscriptions.mockResolvedValueOnce({
      subscriptions: mockPasses,
    });

    const { result } = renderHook(() => usePasses());

    // Wait for initial fetch
    await act(async () => {});

    expect(subscriptionApi.listSubscriptions).toHaveBeenCalledWith({
      limit: 100,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.passes).toHaveLength(4);
    expect(result.current.activePasses).toHaveLength(1);
    expect(result.current.queuedPasses).toHaveLength(1);
    expect(result.current.pastPasses).toHaveLength(2); // 1 expired + 1 cancelled
    expect(result.current.counters).toEqual({
      active: 1,
      queued: 1,
      past: 2,
      totalInvested: 7500, // 2500 + 2500 + 1000 + 1500
    });
  });

  it("filters passes by selected category", async () => {
    subscriptionApi.listSubscriptions.mockResolvedValueOnce({
      subscriptions: mockPasses,
    });

    const { result } = renderHook(() => usePasses());
    await act(async () => {});

    // Select 'Strength' category (id: 1)
    act(() => {
      result.current.setSelectedCategory(1);
    });

    expect(result.current.filteredActive).toHaveLength(1);
    expect(result.current.filteredQueued).toHaveLength(1);
    expect(result.current.filteredPast).toHaveLength(0);

    // Select 'Yoga' category (id: 2)
    act(() => {
      result.current.setSelectedCategory(2);
    });

    expect(result.current.filteredActive).toHaveLength(0);
    expect(result.current.filteredQueued).toHaveLength(0);
    expect(result.current.filteredPast).toHaveLength(1);
  });

  it("executes cancelPass and refreshes subscriptions", async () => {
    subscriptionApi.listSubscriptions
      .mockResolvedValueOnce({ subscriptions: mockPasses })
      .mockResolvedValueOnce({
        subscriptions: mockPasses.map((p) =>
          p.id === 2 ? { ...p, status: "cancelled" } : p,
        ),
      });

    subscriptionApi.cancelSubscription.mockResolvedValueOnce({
      message: "Subscription successfully cancelled.",
    });

    const { result } = renderHook(() => usePasses());
    await act(async () => {});

    let cancelResult;
    await act(async () => {
      cancelResult = await result.current.cancelPass(2);
    });

    expect(subscriptionApi.cancelSubscription).toHaveBeenCalledWith(2);
    expect(cancelResult.message).toBe("Subscription successfully cancelled.");
    expect(subscriptionApi.listSubscriptions).toHaveBeenCalledTimes(2);
  });
});
