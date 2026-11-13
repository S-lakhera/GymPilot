import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MockPaymentGatewayModal } from "../MockPaymentGatewayModal.jsx";

describe("MockPaymentGatewayModal Component", () => {
  it("renders gateway header, methods, and test outcome controls", () => {
    render(
      <MockPaymentGatewayModal
        isOpen={true}
        amount={2499}
        transactionReference="TXN-SAMPLE-123"
        onConfirm={vi.fn()}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/GymPilot Secure Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Ref: TXN-SAMPLE-123/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^UPI$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Card$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Net Banking$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /✓ Test SUCCESS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /✕ Test FAILURE/i })).toBeInTheDocument();
  });

  it("switches payment method views between UPI, Card, and Net Banking", () => {
    render(
      <MockPaymentGatewayModal
        isOpen={true}
        amount={2499}
        transactionReference="TXN-SAMPLE-123"
        onConfirm={vi.fn()}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Initial UPI view
    expect(screen.getByLabelText(/Simulated UPI QR Code/i)).toBeInTheDocument();

    // Switch to Card
    fireEvent.click(screen.getByRole("button", { name: /^Card$/i }));
    expect(screen.getByPlaceholderText("4532 8920 1234 5678")).toBeInTheDocument();

    // Switch to Net Banking
    fireEvent.click(screen.getByRole("button", { name: /^Net Banking$/i }));
    expect(screen.getByText("HDFC Bank")).toBeInTheDocument();
  });

  it("handles payment execution and triggers onConfirm", async () => {
    const onConfirmMock = vi.fn().mockResolvedValue({
      payment: { id: 1, payment_status: "COMPLETED" },
    });
    const onSuccessMock = vi.fn();

    render(
      <MockPaymentGatewayModal
        isOpen={true}
        amount={2499}
        transactionReference="TXN-SAMPLE-123"
        onConfirm={onConfirmMock}
        onSuccess={onSuccessMock}
        onClose={vi.fn()}
      />
    );

    const payBtn = screen.getByRole("button", { name: /Pay ₹\s?2,499/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith("SUCCESS");
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});

