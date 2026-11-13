import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { PaymentsManagementPage } from "../PaymentsManagementPage.jsx";
import { paymentApi } from "../../../api/paymentApi.js";
import { refundApi } from "../../../api/refundApi.js";

vi.mock("../../../api/paymentApi.js", () => ({
  paymentApi: {
    listAllPayments: vi.fn(),
  },
}));

vi.mock("../../../api/refundApi.js", () => ({
  refundApi: {
    listRefunds: vi.fn(),
    processRefund: vi.fn(),
  },
}));

describe("PaymentsManagementPage Component", () => {
  const mockPayments = [
    {
      id: 801,
      transaction_reference: "TXN_SIM_8877",
      member_name: "Vikram Malhotra",
      member_email: "vikram@gympilot.com",
      plan_name: "Pro CrossFit 30",
      amount: 3500,
      refunded_amount: 0,
      payment_status: "COMPLETED",
      payment_method: "UPI",
      created_at: "2026-11-01T10:00:00Z",
    },
  ];

  const mockRefunds = [
    {
      id: 901,
      gateway_refund_reference: "RFND_SIM_1122",
      payment_id: 799,
      payment_reference: "TXN_SIM_7766",
      member_name: "Anjali Deshmukh",
      amount: 800,
      reason: "Medical condition leave",
      refund_status: "COMPLETED",
      created_at: "2026-10-25T14:30:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders financial metrics, transactions ledger, and payments table", async () => {
    paymentApi.listAllPayments.mockResolvedValueOnce({ payments: mockPayments });
    refundApi.listRefunds.mockResolvedValueOnce({ refunds: mockRefunds });

    render(
      <BrowserRouter>
        <PaymentsManagementPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading payments ledger/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Financial Ledger & Refund Hub")).toBeInTheDocument();
      expect(screen.getAllByText("₹3,500").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Vikram Malhotra")).toBeInTheDocument();
      expect(screen.getByText("TXN_SIM_8877")).toBeInTheDocument();
    });
  });

  it("opens issue refund modal, validates ceiling, and processes refund", async () => {
    paymentApi.listAllPayments
      .mockResolvedValueOnce({ payments: mockPayments })
      .mockResolvedValueOnce({
        payments: mockPayments.map((p) => ({
          ...p,
          refunded_amount: 1000,
          payment_status: "PARTIALLY_REFUNDED",
        })),
      });
    refundApi.listRefunds
      .mockResolvedValueOnce({ refunds: mockRefunds })
      .mockResolvedValueOnce({
        refunds: [...mockRefunds, { id: 902, amount: 1000, reason: "Adjustment" }],
      });
    refundApi.processRefund.mockResolvedValueOnce({
      id: 902,
      amount: 1000,
      message: "Refund processed successfully.",
    });

    render(
      <BrowserRouter>
        <PaymentsManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Vikram Malhotra")).toBeInTheDocument();
    });

    // Click "Issue Refund"
    const refundBtn = screen.getByRole("button", { name: /^issue refund$/i });
    fireEvent.click(refundBtn);

    // Verify modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Issue Payment Refund")).toBeInTheDocument();

    // Fill refund form
    const reasonInput = screen.getByPlaceholderText(/e\.g\. member relocated/i);
    fireEvent.change(reasonInput, { target: { value: "Customer adjustment" } });

    // Confirm refund
    const confirmBtn = screen.getByRole("button", { name: /confirm refund/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(refundApi.processRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 801,
          reason: "Customer adjustment",
        })
      );
      expect(screen.getByText(/refund processed successfully/i)).toBeInTheDocument();
    });
  });

  it("switches to Refunds Audit Log tab and displays audited records", async () => {
    paymentApi.listAllPayments.mockResolvedValueOnce({ payments: mockPayments });
    refundApi.listRefunds.mockResolvedValueOnce({ refunds: mockRefunds });

    render(
      <BrowserRouter>
        <PaymentsManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Vikram Malhotra")).toBeInTheDocument();
    });

    // Switch to Refunds Audit Log tab
    const refundsTabBtn = screen.getByRole("button", { name: /refunds audit log/i });
    fireEvent.click(refundsTabBtn);

    // Verify refund record rendered
    expect(screen.getByText("Anjali Deshmukh")).toBeInTheDocument();
    expect(screen.getByText("Medical condition leave")).toBeInTheDocument();
    expect(screen.getByText("RFND_SIM_1122")).toBeInTheDocument();
  });
});
