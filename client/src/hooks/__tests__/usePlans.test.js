import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePlans } from "../usePlans.js";
import { planApi } from "../../api/planApi.js";
import { categoryApi } from "../../api/categoryApi.js";

vi.mock("../../api/planApi.js", () => ({
  planApi: {
    listPlans: vi.fn(),
  },
}));

vi.mock("../../api/categoryApi.js", () => ({
  categoryApi: {
    listCategories: vi.fn(),
  },
}));

describe("usePlans Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches active plans and categories on mount and filters by selected category", async () => {
    const mockPlans = [
      { id: 1, name: "Strength 30", category_id: 1, price: 1999 },
      { id: 2, name: "Cardio 30", category_id: 2, price: 1499 },
    ];
    const mockCategories = [
      { id: 1, name: "Strength Training" },
      { id: 2, name: "Cardio & HIIT" },
    ];

    planApi.listPlans.mockResolvedValueOnce(mockPlans);
    categoryApi.listCategories.mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => usePlans());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual(mockPlans);
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.filteredPlans).toEqual(mockPlans);

    // Filter by category 1
    act(() => {
      result.current.setSelectedCategoryId(1);
    });

    expect(result.current.filteredPlans).toHaveLength(1);
    expect(result.current.filteredPlans[0].name).toBe("Strength 30");
  });
});
