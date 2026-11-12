import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { MemberDashboard } from "../MemberDashboard.jsx";
import { dashboardApi } from "../../../api/dashboardApi.js";

vi.mock("../../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: 5, firstName: "Sneha", role: "member" },
    isAuthenticated: true,
  }),
}));

vi.mock("../../../hooks/useToast.js", () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn() },
  }),
}));

vi.mock("../../../api/dashboardApi.js", () => ({
  dashboardApi: {
    getMemberDashboard: vi.fn(),
  },
}));

const mockMultiPassData = {
  activePasses: [
    {
      subscriptionId: 10,
      planId: 1,
      planName: "Pro Strength 30",
      categoryName: "Strength Training",
      startDate: "2026-10-15",
      endDate: "2026-11-14",
      status: "active",
      finalAmount: 2499,
      currency: "INR",
      daysRemaining: 2,
    },
    {
      subscriptionId: 11,
      planId: 3,
      planName: "Cardio Kickstart",
      categoryName: "Cardio & HIIT",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      status: "active",
      finalAmount: 1999,
      currency: "INR",
      daysRemaining: 18,
    },
  ],
  queuedRenewals: [
    {
      subscriptionId: 12,
      planId: 2,
      planName: "Pro Strength 90",
      categoryName: "Strength Training",
      startDate: "2026-11-15",
      endDate: "2027-02-12",
      status: "queued",
      finalAmount: 6499,
      currency: "INR",
      daysRemaining: 0,
    },
  ],
  nearestExpiration: {
    subscriptionId: 10,
    planName: "Pro Strength 30",
    endDate: "2026-11-14",
    daysRemaining: 2,
  },
  recentPayments: [
    {
      paymentId: 501,
      amount: 2499,
      currency: "INR",
      paymentMethod: "UPI",
      paymentStatus: "COMPLETED",
      paymentDate: "2026-10-15T09:30:00.000Z",
      transactionReference: "TXN_MEMBER_501",
      planName: "Pro Strength 30",
    },
  ],
  profileCompleteness: {
    completedFields: 4,
    totalFields: 5,
    percentage: 80,
    fields: {
      phone: true,
      dateOfBirth: true,
      gender: true,
      emergencyContactName: true,
      emergencyContactPhone: false,
      healthConditions: false,
    },
  },
};

describe("MemberDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders multiple active passes with nearest expiry as Hero card and independent category renewal logic", async () => {
    dashboardApi.getMemberDashboard.mockResolvedValueOnce(mockMultiPassData);

    render(
      <BrowserRouter>
        <MemberDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Sneha/i)).toBeInTheDocument();
    });

    // Primary Pass in Hero Card
    expect(screen.getAllByText("Pro Strength 30").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2 Days Left — Expiring Soon!/i)).toBeInTheDocument();

    // Since Strength has a queued renewal, the Hero card displays renewal scheduled
    expect(screen.getByText(/Renewal Scheduled/i)).toBeInTheDocument();

    // Secondary Pass in Secondary Grid
    expect(screen.getByText("Cardio Kickstart")).toBeInTheDocument();
    expect(screen.getByText(/18 days left/i)).toBeInTheDocument();

    // Cardio has NO queued renewal, so its Renew button remains present
    expect(screen.getByRole("link", { name: /^Renew$/i })).toBeInTheDocument();

    // Queued Renewals section
    expect(screen.getByText("Upcoming Scheduled Renewals (1)")).toBeInTheDocument();
    expect(screen.getByText("Pro Strength 90")).toBeInTheDocument();

    // Profile Completeness Banner: shows 80% and missing Emergency Contact Phone
    expect(screen.getByText(/Profile Incomplete — 80%/i)).toBeInTheDocument();
    expect(screen.getByText("Emergency Contact Phone")).toBeInTheDocument();
    // Optional health conditions should NOT be presented as a required missing chip
    expect(screen.queryByText(/Health Conditions/i)).not.toBeInTheDocument();

    // Personal Payment Receipts
    expect(screen.getByText("TXN_MEMBER_501")).toBeInTheDocument();
    expect(screen.getByText(/₹2,499/i)).toBeInTheDocument();
  });

  it("handles empty pass state with clean onboarding prompt", async () => {
    dashboardApi.getMemberDashboard.mockResolvedValueOnce({
      activePasses: [],
      queuedRenewals: [],
      nearestExpiration: null,
      recentPayments: [],
      profileCompleteness: { percentage: 100, totalFields: 5, completedFields: 5 },
    });

    render(
      <BrowserRouter>
        <MemberDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Active Gym Passes/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Browse Plans/i })).toBeInTheDocument();
    });

    // Profile completeness is 100%, so banner should not be in document
    expect(screen.queryByText(/Profile Incomplete/i)).not.toBeInTheDocument();
  });
});
