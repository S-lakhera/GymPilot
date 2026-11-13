import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategories } from "../useCategories.js";
import { categoryApi } from "../../api/categoryApi.js";

vi.mock("../../api/categoryApi.js", () => ({
  categoryApi: {
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    toggleCategoryStatus: vi.fn(),
  },
}));

describe("useCategories hook", () => {
  const mockCategories = [
    { id: 10, name: "Strength", description: "Weightlifting", is_active: 1 },
    { id: 20, name: "Cardio", description: "Endurance", is_active: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches categories including inactive on mount", async () => {
    categoryApi.listCategories.mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories());
    await act(async () => {});

    expect(categoryApi.listCategories).toHaveBeenCalledWith({ includeInactive: true });
    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toHaveLength(2);
  });

  it("creates a new category and refreshes list", async () => {
    categoryApi.listCategories
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce([...mockCategories, { id: 30, name: "Pilates" }]);
    categoryApi.createCategory.mockResolvedValueOnce({ id: 30, name: "Pilates" });

    const { result } = renderHook(() => useCategories());
    await act(async () => {});

    await act(async () => {
      await result.current.createCategory({ name: "Pilates", description: "Core strength" });
    });

    expect(categoryApi.createCategory).toHaveBeenCalledWith({
      name: "Pilates",
      description: "Core strength",
    });
    expect(categoryApi.listCategories).toHaveBeenCalledTimes(2);
  });

  it("toggles category status and updates local state", async () => {
    categoryApi.listCategories.mockResolvedValueOnce(mockCategories);
    categoryApi.toggleCategoryStatus.mockResolvedValueOnce({ id: 10, is_active: 0 });

    const { result } = renderHook(() => useCategories());
    await act(async () => {});

    await act(async () => {
      await result.current.toggleCategoryStatus(10, false);
    });

    expect(categoryApi.toggleCategoryStatus).toHaveBeenCalledWith(10, false);
    expect(result.current.categories[0].is_active).toBe(0);
  });
});
