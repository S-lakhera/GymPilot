import { describe, it, expect, vi, beforeEach } from "vitest";
import { refundApi } from "../refundApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("refundApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processRefund calls POST /refunds with payload", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: {
          id: 5,
          payment_id: 10,
          amount: 250,
          refund_status: "COMPLETED",
        },
      },
    };
    axiosClient.post.mockResolvedValueOnce(mockResponse);

    const result = await refundApi.processRefund({
      paymentId: 10,
      amount: 250,
      reason: "Member moved to another city",
    });

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/refunds",
      {
        paymentId: 10,
        amount: 250,
        reason: "Member moved to another city",
      },
      {}
    );
    expect(result.id).toBe(5);
  });

  it("listRefunds calls GET /refunds with query params", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: [{ id: 1, amount: 500 }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    };
    axiosClient.get.mockResolvedValueOnce(mockResponse);

    const result = await refundApi.listRefunds({ page: 1, limit: 20 });
    expect(axiosClient.get).toHaveBeenCalledWith("/refunds", {
      params: { page: 1, limit: 20 },
    });
    expect(result.refunds).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("getRefundsByPaymentId calls GET /refunds/payment/:paymentId", async () => {
    const mockResponse = {
      data: {
        status: "success",
        data: {
          refunds: [{ id: 2, payment_id: 15, amount: 300 }],
        },
      },
    };
    axiosClient.get.mockResolvedValueOnce(mockResponse);

    const result = await refundApi.getRefundsByPaymentId(15);
    expect(axiosClient.get).toHaveBeenCalledWith("/refunds/payment/15", {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

