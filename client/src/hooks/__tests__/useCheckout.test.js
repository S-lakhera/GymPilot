import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCheckout } from "../useCheckout.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";
import { paymentApi } from "../../api/paymentApi.js";

vi.mock("../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    getPricingQuote: vi.fn(),
    checkoutSubscription: vi.fn(),
  },
}));

vi.mock("../../api/paymentApi.js", () => ({
  paymentApi: {
    confirmPayment: vi.fn(),
  },
}));

describe("useCheckout Hook", () => {
  const mockPlan = {
    id: 1,
    name: "Pro Strength 30",
    category_id: 1,
    price: 2499,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches quote on mount when plan is provided", async () => {
    const mockQuote = {
      planId: 1,
      baseAmount: 2499,
      discountAmount: 0,
      finalAmount: 2499,
    };
    subscriptionApi.getPricingQuote.mockResolvedValueOnce(mockQuote);

    const { result } = renderHook(() => useCheckout(mockPlan));

    expect(result.current.quoteLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.quoteLoading).toBe(false);
    });

    expect(result.current.quote).toEqual(mockQuote);
    expect(subscriptionApi.getPricingQuote).toHaveBeenCalledWith({
      planId: 1,
      discountCode: undefined,
    });
  });

  it("detects when a renewal will be queued behind an active pass in the same category", async () => {
    const activePasses = [
      { id: 10, category_id: 1, status: "active", end_date: "2026-11-20" },
    ];
    subscriptionApi.getPricingQuote.mockResolvedValueOnce({ finalAmount: 2499 });

    const { result } = renderHook(() => useCheckout(mockPlan, activePasses));

    await waitFor(() => {
      expect(result.current.quoteLoading).toBe(false);
    });

    expect(result.current.schedulingInfo.willQueue).toBe(true);
    expect(result.current.schedulingInfo.isBlocked).toBe(false);
    expect(result.current.schedulingInfo.message).toContain("20 Nov 2026");
  });

  it("detects when checkout is blocked due to existing queued pass", async () => {
    const activePasses = [
      { id: 10, category_id: 1, status: "active", end_date: "2026-11-20" },
      { id: 11, category_id: 1, status: "queued", start_date: "2026-11-21" },
    ];
    subscriptionApi.getPricingQuote.mockResolvedValueOnce({ finalAmount: 2499 });

    const { result } = renderHook(() => useCheckout(mockPlan, activePasses));

    await waitFor(() => {
      expect(result.current.quoteLoading).toBe(false);
    });

    expect(result.current.schedulingInfo.isBlocked).toBe(true);
    expect(result.current.schedulingInfo.reason).toContain("queued renewal");
  });

  it("executes checkout and confirms payment simulation successfully", async () => {
    subscriptionApi.getPricingQuote.mockResolvedValueOnce({ finalAmount: 2499 });
    subscriptionApi.checkoutSubscription.mockResolvedValueOnce({
      subscription: { id: 5 },
      payment: { id: 12, transaction_reference: "TXN-TEST-123" },
      pricing: { finalAmount: 2499 },
    });
    paymentApi.confirmPayment.mockResolvedValueOnce({
      alreadyProcessed: false,
      payment: { id: 12, payment_status: "COMPLETED" },
    });

    const { result } = renderHook(() => useCheckout(mockPlan));

    await waitFor(() => {
      expect(result.current.quoteLoading).toBe(false);
    });

    let checkoutRes;
    await act(async () => {
      checkoutRes = await result.current.executeCheckout();
    });

    expect(checkoutRes.payment.transaction_reference).toBe("TXN-TEST-123");
    expect(result.current.checkoutResult).toBeTruthy();

    let confirmRes;
    await act(async () => {
      confirmRes = await result.current.confirmPaymentSimulation("SUCCESS");
    });

    expect(confirmRes.payment.payment_status).toBe("COMPLETED");
  });
});
