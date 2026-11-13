import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutModal } from "../CheckoutModal.jsx";
import { subscriptionApi } from "../../../api/subscriptionApi.js";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    getPricingQuote: vi.fn(),
    checkoutSubscription: vi.fn(),
  },
}));

vi.mock("../../../api/paymentApi.js", () => ({
  paymentApi: {
    confirmPayment: vi.fn(),
  },
}));

describe("CheckoutModal Component", () => {
  const mockPlan = {
    id: 1,
    name: "Pro Strength 30",
    category_id: 1,
    category_name: "Strength Training",
    duration_days: 30,
    price: 2499,
    description: "Strength zone access.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quote details and breakdown within accessible dialog", async () => {
    subscriptionApi.getPricingQuote.mockResolvedValueOnce({
      planId: 1,
      baseAmount: 2499,
      discountAmount: 0,
      finalAmount: 2499,
      currency: "INR",
    });

    render(
      <BrowserRouter>
        <CheckoutModal isOpen={true} plan={mockPlan} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Membership Checkout/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Total Payable:/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Proceed to Pay/i }),
    ).toBeInTheDocument();
  });

  it("applies promotional discount coupon and updates price breakdown", async () => {
    subscriptionApi.getPricingQuote
      .mockResolvedValueOnce({
        planId: 1,
        baseAmount: 2499,
        discountAmount: 0,
        finalAmount: 2499,
      })
      .mockResolvedValueOnce({
        planId: 1,
        baseAmount: 2499,
        discountAmount: 249,
        finalAmount: 2250,
        discount: { code: "FIT10" },
      });

    render(
      <BrowserRouter>
        <CheckoutModal isOpen={true} plan={mockPlan} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/e.g. WELCOME10/i),
      ).toBeInTheDocument();
    });

    const couponInput = screen.getByPlaceholderText(/e.g. WELCOME10/i);
    fireEvent.change(couponInput, { target: { value: "FIT10" } });

    const applyBtn = screen.getByRole("button", { name: /^Apply$/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/FIT10/i)).toBeInTheDocument();
      expect(screen.getByText(/Promotional Savings:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/₹\s?2,250/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
