import { describe, it, expect, vi, beforeEach } from "vitest";
import { discountApi } from "../discountApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("discountApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listDiscounts calls GET /discounts with params", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: [{ id: 1, code: "SAVE20", discount_value: 20 }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    };
    axiosClient.get.mockResolvedValueOnce(mockResponse);

    const result = await discountApi.listDiscounts({ limit: 10 });
    expect(axiosClient.get).toHaveBeenCalledWith("/discounts", {
      params: { limit: 10 },
    });
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].code).toBe("SAVE20");
  });

  it("createDiscount calls POST /discounts with payload", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: {
          discount: { id: 2, code: "FLAT500" },
        },
      },
    };
    axiosClient.post.mockResolvedValueOnce(mockResponse);

    const result = await discountApi.createDiscount({
      code: "FLAT500",
      discountType: "FIXED",
      discountValue: 500,
    });
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/discounts",
      {
        code: "FLAT500",
        discountType: "FIXED",
        discountValue: 500,
      },
      {}
    );
    expect(result.code).toBe("FLAT500");
  });

  it("toggleDiscountStatus calls PATCH /discounts/:id/status", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: { id: 2, is_active: false },
      },
    };
    axiosClient.patch.mockResolvedValueOnce(mockResponse);

    const result = await discountApi.toggleDiscountStatus(2, false);
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/discounts/2/status",
      { isActive: false },
      {}
    );
    expect(result.is_active).toBe(false);
  });
});

