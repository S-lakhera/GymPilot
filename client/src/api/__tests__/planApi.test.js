import { describe, it, expect, vi, beforeEach } from "vitest";
import { planApi } from "../planApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("planApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listPlans queries /plans with params and returns data array", async () => {
    const mockPlans = [
      {
        id: 1,
        name: "Strength Starter",
        price: 1999,
        category_name: "Strength",
      },
    ];
    axiosClient.get.mockResolvedValueOnce({
      data: { status: "success", data: { plans: mockPlans } },
    });

    const result = await planApi.listPlans({ categoryId: 2 });
    expect(axiosClient.get).toHaveBeenCalledWith("/plans", {
      params: { categoryId: 2 },
    });
    expect(result).toEqual(mockPlans);
  });

  it("getPlanById fetches single plan", async () => {
    const mockPlan = { id: 3, name: "Cardio Kickstart", price: 1499 };
    axiosClient.get.mockResolvedValueOnce({
      data: { status: "success", data: mockPlan },
    });

    const result = await planApi.getPlanById(3);
    expect(axiosClient.get).toHaveBeenCalledWith("/plans/3", {});
    expect(result).toEqual(mockPlan);
  });

  it("createPlan sends post request", async () => {
    const planPayload = {
      categoryId: 1,
      name: "Pro Plan",
      durationDays: 30,
      price: 2999,
    };
    axiosClient.post.mockResolvedValueOnce({
      data: { status: "success", data: { id: 10, ...planPayload } },
    });

    const result = await planApi.createPlan(planPayload);
    expect(axiosClient.post).toHaveBeenCalledWith("/plans", planPayload, {});
    expect(result.id).toBe(10);
  });
});
