import { describe, it, expect, vi, beforeEach } from "vitest";
import { categoryApi } from "../categoryApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("categoryApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCategories unrolls categories array from server envelope", async () => {
    const mockCategories = [
      { id: 1, name: "Strength", description: "Weight training", is_active: 1 },
      { id: 2, name: "Cardio", description: "Endurance", is_active: 1 },
    ];

    axiosClient.get.mockResolvedValueOnce({
      data: {
        status: "success",
        message: "Plan categories retrieved successfully.",
        data: { categories: mockCategories },
      },
    });

    const result = await categoryApi.listCategories({ includeInactive: true });
    expect(axiosClient.get).toHaveBeenCalledWith("/categories", {
      params: { includeInactive: true },
    });
    expect(result).toEqual(mockCategories);
  });

  it("listCategories returns empty array when categories is absent", async () => {
    axiosClient.get.mockResolvedValueOnce({
      data: {
        status: "success",
        data: {},
      },
    });

    const result = await categoryApi.listCategories();
    expect(result).toEqual([]);
  });

  it("createCategory sends post request and returns category", async () => {
    const payload = { name: "Pilates", description: "Core conditioning" };
    axiosClient.post.mockResolvedValueOnce({
      data: {
        status: "success",
        data: { category: { id: 5, ...payload } },
      },
    });

    const result = await categoryApi.createCategory(payload);
    expect(axiosClient.post).toHaveBeenCalledWith("/categories", payload, {});
    expect(result).toEqual({ category: { id: 5, ...payload } });
  });
});
