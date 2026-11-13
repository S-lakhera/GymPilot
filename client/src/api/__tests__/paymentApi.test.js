import { describe, it, expect, vi, beforeEach } from "vitest";
import { paymentApi } from "../paymentApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("paymentApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirmPayment sends payload and returns confirmation data", async () => {
    const mockConfirmResult = {
      alreadyProcessed: false,
      payment: { id: 10, payment_status: "COMPLETED" },
      message: "Payment confirmed successfully.",
    };
    axiosClient.post.mockResolvedValueOnce({
      data: { status: "success", data: mockConfirmResult },
    });

    const result = await paymentApi.confirmPayment({
      transactionReference: "TXN-12345",
      simulatedStatus: "SUCCESS",
    });

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/payments/confirm",
      { transactionReference: "TXN-12345", simulatedStatus: "SUCCESS" },
      {}
    );
    expect(result.payment.payment_status).toBe("COMPLETED");
  });

  it("getMyPayments fetches member receipts with pagination", async () => {
    const mockPayments = [{ id: 10, amount: 1800, payment_status: "COMPLETED" }];
    const mockPagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
    axiosClient.get.mockResolvedValueOnce({
      data: { status: "success", data: mockPayments, pagination: mockPagination },
    });

    const result = await paymentApi.getMyPayments({ page: 1 });
    expect(axiosClient.get).toHaveBeenCalledWith("/payments/my", {
      params: { page: 1 },
    });
    expect(result.payments).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

