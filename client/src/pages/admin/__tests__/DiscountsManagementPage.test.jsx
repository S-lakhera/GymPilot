import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscountsManagementPage } from "../DiscountsManagementPage.jsx";
import { discountApi } from "../../../api/discountApi.js";

vi.mock("../../../api/discountApi.js", () => ({
  discountApi: {
    listDiscounts: vi.fn(),
    createDiscount: vi.fn(),
    updateDiscount: vi.fn(),
    toggleDiscountStatus: vi.fn(),
  },
}));

describe("DiscountsManagementPage Component", () => {
  const mockDiscounts = [
    {
      id: 401,
      code: "FESTIVE30",
      name: "Festival 30% Off",
      description: "Applies to all plans",
      discount_type: "PERCENTAGE",
      discount_value: 30,
      max_discount_amount: 600,
      min_purchase_amount: 1500,
      start_date: "2026-10-01",
      end_date: "2026-11-30",
      usage_limit: 50,
      used_count: 12,
      is_active: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders discounts title, filter bar, and coupons table", async () => {
    discountApi.listDiscounts.mockResolvedValueOnce({ discounts: mockDiscounts });

    render(<DiscountsManagementPage />);

    expect(screen.getByText(/loading promotional coupons/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Promotional Discounts & Coupons")).toBeInTheDocument();
      expect(screen.getByText("FESTIVE30")).toBeInTheDocument();
      expect(screen.getByText("Festival 30% Off")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText("12 / 50")).toBeInTheDocument();
    });
  });

  it("opens create coupon modal and creates a new discount code", async () => {
    discountApi.listDiscounts
      .mockResolvedValueOnce({ discounts: mockDiscounts })
      .mockResolvedValueOnce([
        ...mockDiscounts,
        {
          id: 402,
          code: "FLAT300",
          name: "Flat 300 Off",
          discount_type: "FIXED",
          discount_value: 300,
          is_active: 1,
        },
      ]);
    discountApi.createDiscount.mockResolvedValueOnce({
      id: 402,
      code: "FLAT300",
    });

    render(<DiscountsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("FESTIVE30")).toBeInTheDocument();
    });

    // Click "+ Create Coupon Code"
    const createBtn = screen.getByRole("button", { name: /\+ create coupon code/i });
    fireEvent.click(createBtn);

    // Verify modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Promotional Coupon")).toBeInTheDocument();

    // Fill coupon code
    const codeInput = screen.getByPlaceholderText(/e\.g\. summer25/i);
    fireEvent.change(codeInput, { target: { value: "FLAT300" } });

    // Fill coupon name
    const nameInput = screen.getByPlaceholderText(/e\.g\. summer fitness kickoff/i);
    fireEvent.change(nameInput, { target: { value: "Flat 300 Off" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /^create coupon$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(discountApi.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FLAT300",
          name: "Flat 300 Off",
        })
      );
      expect(screen.getByText(/coupon "FLAT300" created successfully/i)).toBeInTheDocument();
    });
  });
});

