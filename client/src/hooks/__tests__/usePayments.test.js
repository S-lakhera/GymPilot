import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePayments } from "../usePayments.js";
import { paymentApi } from "../../api/paymentApi.js";
import { refundApi } from "../../api/refundApi.js";

vi.mock("../../api/paymentApi.js", () => ({
  paymentApi: {
    listAllPayments: vi.fn(),
  },
}));

vi.mock("../../api/refundApi.js", () => ({
  refundApi: {
    listRefunds: vi.fn(),
    processRefund: vi.fn(),
  },
}));

describe("usePayments hook", () => {
  const mockPayments = [
    {
      id: 1,
      member_name: "Karan Singh",
      member_email: "karan@gympilot.com",
      plan_name: "Strength Monthly",
      amount: 3000,
      refunded_amount: 0,
      payment_status: "COMPLETED",
      payment_method: "UPI",
    },
    {
      id: 2,
      member_name: "Pooja Hegde",
      member_email: "pooja@gympilot.com",
      plan_name: "Yoga 30",
      amount: 2000,
      refunded_amount: 500,
      payment_status: "PARTIALLY_REFUNDED",
      payment_method: "CARD",
    },
  ];

  const mockRefunds = [
    {
      id: 101,
      payment_id: 2,
      member_name: "Pooja Hegde",
      amount: 500,
      reason: "Medical injury",
      refund_status: "COMPLETED",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches payments and refunds on mount and calculates aggregate metrics", async () => {
    paymentApi.listAllPayments.mockResolvedValueOnce({ payments: mockPayments });
    refundApi.listRefunds.mockResolvedValueOnce({ refunds: mockRefunds });

    const { result } = renderHook(() => usePayments());
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.payments).toHaveLength(2);
    expect(result.current.refunds).toHaveLength(1);

    // Verify metrics:
    // Gross: 3000 + 2000 = 5000
    // Total Refunded: 0 + 500 = 500
    // Net: 5000 - 500 = 4500
    // Completed: 2
    expect(result.current.metrics).toEqual({
      grossCollected: 5000,
      totalRefunded: 500,
      netRevenue: 4500,
      completedCount: 2,
    });
  });

  it("issues a refund and refreshes financial records", async () => {
    paymentApi.listAllPayments
      .mockResolvedValueOnce({ payments: mockPayments })
      .mockResolvedValueOnce({
        payments: mockPayments.map((p) =>
          p.id === 1 ? { ...p, refunded_amount: 1000, payment_status: "PARTIALLY_REFUNDED" } : p
        ),
      });
    refundApi.listRefunds
      .mockResolvedValueOnce({ refunds: mockRefunds })
      .mockResolvedValueOnce({
        refunds: [...mockRefunds, { id: 102, payment_id: 1, amount: 1000 }],
      });
    refundApi.processRefund.mockResolvedValueOnce({ id: 102, amount: 1000 });

    const { result } = renderHook(() => usePayments());
    await act(async () => {});

    await act(async () => {
      await result.current.issueRefund({
        paymentId: 1,
        amount: 1000,
        reason: "Customer service adjustment",
      });
    });

    expect(refundApi.processRefund).toHaveBeenCalledWith({
      paymentId: 1,
      amount: 1000,
      reason: "Customer service adjustment",
    });
    expect(paymentApi.listAllPayments).toHaveBeenCalledTimes(2);
    expect(refundApi.listRefunds).toHaveBeenCalledTimes(2);
  });
});

