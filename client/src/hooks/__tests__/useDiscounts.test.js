import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDiscounts } from "../useDiscounts.js";
import { discountApi } from "../../api/discountApi.js";

vi.mock("../../api/discountApi.js", () => ({
  discountApi: {
    listDiscounts: vi.fn(),
    createDiscount: vi.fn(),
    updateDiscount: vi.fn(),
    toggleDiscountStatus: vi.fn(),
  },
}));

describe("useDiscounts hook", () => {
  const mockDiscounts = [
    {
      id: 1,
      code: "WELCOME20",
      name: "New Member 20%",
      discount_type: "PERCENTAGE",
      discount_value: 20,
      is_active: 1,
    },
    {
      id: 2,
      code: "FESTIVE500",
      name: "Diwali 500 Off",
      discount_type: "FIXED",
      discount_value: 500,
      is_active: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches discounts on mount and supports status filtering", async () => {
    discountApi.listDiscounts.mockResolvedValueOnce({
      discounts: mockDiscounts,
    });

    const { result } = renderHook(() => useDiscounts());
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.discounts).toHaveLength(2);
    expect(result.current.filteredDiscounts).toHaveLength(2);

    // Filter by active status
    act(() => {
      result.current.setStatusFilter("active");
    });
    expect(result.current.filteredDiscounts).toHaveLength(1);
    expect(result.current.filteredDiscounts[0].code).toBe("WELCOME20");
  });

  it("creates a new coupon and triggers refetch", async () => {
    discountApi.listDiscounts
      .mockResolvedValueOnce({ discounts: mockDiscounts })
      .mockResolvedValueOnce([...mockDiscounts, { id: 3, code: "SUMMER10" }]);
    discountApi.createDiscount.mockResolvedValueOnce({
      id: 3,
      code: "SUMMER10",
    });

    const { result } = renderHook(() => useDiscounts());
    await act(async () => {});

    await act(async () => {
      await result.current.createDiscount({
        code: "SUMMER10",
        name: "Summer 10%",
        discountType: "PERCENTAGE",
        discountValue: 10,
        startDate: "2026-06-01",
        endDate: "2026-06-30",
      });
    });

    expect(discountApi.createDiscount).toHaveBeenCalled();
    expect(discountApi.listDiscounts).toHaveBeenCalledTimes(2);
  });
});
