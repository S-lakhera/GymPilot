import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAdminPlans } from "../useAdminPlans.js";
import { planApi } from "../../api/planApi.js";

vi.mock("../../api/planApi.js", () => ({
  planApi: {
    listPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    togglePlanStatus: vi.fn(),
  },
}));

describe("useAdminPlans hook", () => {
  const mockPlans = [
    {
      id: 1,
      name: "Gold Monthly",
      description: "Full gym access",
      category_id: 10,
      category_name: "Strength",
      duration_days: 30,
      price: 2500,
      is_active: 1,
    },
    {
      id: 2,
      name: "Silver Annual",
      description: "Discounted yearly pass",
      category_id: 20,
      category_name: "Cardio",
      duration_days: 365,
      price: 18000,
      is_active: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches plans on mount and supports category and status filtering", async () => {
    planApi.listPlans.mockResolvedValueOnce(mockPlans);

    const { result } = renderHook(() => useAdminPlans());
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.plans).toHaveLength(2);
    expect(result.current.filteredPlans).toHaveLength(2);

    // Filter by category
    act(() => {
      result.current.setFilterCategory(10);
    });
    expect(result.current.filteredPlans).toHaveLength(1);
    expect(result.current.filteredPlans[0].name).toBe("Gold Monthly");

    // Filter by status
    act(() => {
      result.current.setFilterCategory("all");
      result.current.setStatusFilter("inactive");
    });
    expect(result.current.filteredPlans).toHaveLength(1);
    expect(result.current.filteredPlans[0].name).toBe("Silver Annual");
  });

  it("creates a plan and triggers refetch", async () => {
    planApi.listPlans
      .mockResolvedValueOnce(mockPlans)
      .mockResolvedValueOnce([...mockPlans, { id: 3, name: "Bronze Trial" }]);
    planApi.createPlan.mockResolvedValueOnce({ id: 3, name: "Bronze Trial" });

    const { result } = renderHook(() => useAdminPlans());
    await act(async () => {});

    await act(async () => {
      await result.current.createPlan({
        name: "Bronze Trial",
        categoryId: 10,
        durationDays: 7,
        price: 500,
      });
    });

    expect(planApi.createPlan).toHaveBeenCalledWith({
      name: "Bronze Trial",
      categoryId: 10,
      durationDays: 7,
      price: 500,
    });
    expect(planApi.listPlans).toHaveBeenCalledTimes(2);
  });

  it("toggles plan status and updates local state", async () => {
    planApi.listPlans.mockResolvedValueOnce(mockPlans);
    planApi.togglePlanStatus.mockResolvedValueOnce({ id: 1, is_active: 0 });

    const { result } = renderHook(() => useAdminPlans());
    await act(async () => {});

    await act(async () => {
      await result.current.togglePlanStatus(1, false);
    });

    expect(planApi.togglePlanStatus).toHaveBeenCalledWith(1, false);
    expect(result.current.plans[0].is_active).toBe(0);
  });
});
