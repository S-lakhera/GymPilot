import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscriptionApi } from "../subscriptionApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("subscriptionApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPricingQuote sends planId and discountCode and unwraps quote object", async () => {
    const mockQuote = {
      planId: 1,
      baseAmount: 2000,
      discountAmount: 200,
      finalAmount: 1800,
    };
    axiosClient.post.mockResolvedValueOnce({
      data: { status: "success", data: { quote: mockQuote } },
    });

    const result = await subscriptionApi.getPricingQuote({ planId: 1, discountCode: "SAVE10" });
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/subscriptions/quote",
      { planId: 1, discountCode: "SAVE10" },
      {}
    );
    expect(result).toEqual(mockQuote);
  });

  it("checkoutSubscription initiates checkout and unwraps response", async () => {
    const mockCheckoutData = {
      subscription: { id: 5, status: "pending_payment" },
      payment: { id: 10, transaction_reference: "TXN-12345" },
      pricing: { finalAmount: 1800 },
    };
    axiosClient.post.mockResolvedValueOnce({
      data: { status: "success", data: mockCheckoutData },
    });

    const result = await subscriptionApi.checkoutSubscription({
      planId: 1,
      paymentMethod: "UPI",
    });
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/subscriptions/checkout",
      { planId: 1, paymentMethod: "UPI" },
      {}
    );
    expect(result.payment.transaction_reference).toBe("TXN-12345");
  });

  it("cancelSubscription sends patch with governance options", async () => {
    axiosClient.patch.mockResolvedValueOnce({
      data: { status: "success", data: { subscription: { id: 5, status: "cancelled" } } },
    });

    const result = await subscriptionApi.cancelSubscription(5, { cancelQueued: true });
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/subscriptions/5/cancel",
      { cancelQueued: true },
      {}
    );
    expect(result.subscription.status).toBe("cancelled");
  });
});

