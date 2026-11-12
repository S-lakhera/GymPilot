import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AdminDashboard } from "../AdminDashboard.jsx";
import { dashboardApi } from "../../../api/dashboardApi.js";

// Mock auth hook
vi.mock("../../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: 1, firstName: "Vikram", role: "admin" },
    isAuthenticated: true,
  }),
}));

// Mock toast hook
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock("../../../hooks/useToast.js", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock dashboard API
vi.mock("../../../api/dashboardApi.js", () => ({
  dashboardApi: {
    getAdminDashboard: vi.fn(),
    syncSubscriptionStatuses: vi.fn(),
  },
}));

const mockAdminData = {
  membership: {
    totalMembers: 25,
    activeMembers: 20,
    activeTrainers: 4,
  },
  subscriptions: {
    activeSubscriptions: 18,
    queuedSubscriptions: 3,
    expiringSoon: 4,
    expiredSubscriptions: 8,
  },
  financials: {
    grossRevenue: 95000,
    grossRevenueMtd: 28000,
    grossRevenueToday: 4500,
    totalRefunded: 5000,
    refundedMtd: 2000,
    refundedToday: 0,
    netRevenue: 90000,
    netRevenueMtd: 26000,
    netRevenueToday: 4500,
    pendingPayments: 2,
  },
  categoryDistribution: [
    { categoryId: 1, categoryName: "Strength Training", activeCount: 12 },
    { categoryId: 2, categoryName: "Cardio & HIIT", activeCount: 6 },
  ],
  recentTransactions: [
    {
      paymentId: 101,
      amount: 4500,
      currency: "INR",
      paymentMethod: "UPI",
      paymentStatus: "COMPLETED",
      paymentDate: "2026-11-12T10:00:00.000Z",
      transactionReference: "TXN_101",
      memberName: "Aarav Patel",
      memberEmail: "aarav@example.com",
      planName: "Pro Strength 90",
    },
    {
      paymentId: 102,
      amount: 1500,
      currency: "INR",
      paymentMethod: "CARD",
      paymentStatus: "PARTIALLY_REFUNDED",
      paymentDate: "2026-11-11T16:00:00.000Z",
      transactionReference: "TXN_102",
      memberName: "Rohan Mehra",
      memberEmail: "rohan@example.com",
      planName: "Cardio Monthly",
    },
  ],
  recentMembers: [
    {
      id: 201,
      full_name: "Neha Joshi",
      email: "neha@example.com",
      phone: "+919876543210",
      is_active: 1,
      created_at: "2026-11-12T08:00:00.000Z",
    },
  ],
};

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders financial metrics, distinction of net revenue vs refunds, and recent feeds", async () => {
    dashboardApi.getAdminDashboard.mockResolvedValueOnce(mockAdminData);

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Initial skeleton
    expect(screen.getByLabelText(/Loading dashboard metrics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Vikram/i)).toBeInTheDocument();
    });

    // Net Revenue & Financial Metric checks
    expect(screen.getByText(/₹90,000/i)).toBeInTheDocument(); // Net revenue total
    expect(screen.getByText(/₹95,000/i)).toBeInTheDocument(); // Gross collections
    expect(screen.getByText(/₹5,000/i)).toBeInTheDocument(); // Completed refunds

    // Subscription status counts
    expect(screen.getByText("18")).toBeInTheDocument(); // Active
    expect(screen.getByText("3")).toBeInTheDocument(); // Queued
    expect(screen.getByText("4")).toBeInTheDocument(); // Expiring soon
    expect(screen.getByText("8")).toBeInTheDocument(); // Expired

    // Category Distribution Chart container
    expect(screen.getByLabelText(/Category Distribution Donut Chart/i)).toBeInTheDocument();

    // Financial Comparative Bar Chart container
    expect(screen.getByLabelText(/Financial Comparative Bar Chart/i)).toBeInTheDocument();

    // Recent Transactions with partial refund badge
    expect(screen.getByText("Aarav Patel")).toBeInTheDocument();
    expect(screen.getByText("Rohan Mehra")).toBeInTheDocument();
    expect(screen.getByText("Partially Refunded")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();

    // Recent Members feed
    expect(screen.getByText("Neha Joshi")).toBeInTheDocument();
  });

  it("triggers explicit subscription sync through confirmation modal and refreshes dashboard", async () => {
    dashboardApi.getAdminDashboard.mockResolvedValue(mockAdminData);
    dashboardApi.syncSubscriptionStatuses.mockResolvedValueOnce({
      expiredSubscriptions: 2,
      activatedQueuedSubscriptions: 1,
      purgedStaleSubscriptions: 0,
      purgedStalePayments: 0,
      syncedAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Run Status Sync/i)).toBeInTheDocument();
    });

    const syncButton = screen.getByRole("button", { name: /Run Status Sync/i });
    fireEvent.click(syncButton);

    // Modal opens with accessible labelling
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-sync-heading");
    expect(screen.getByText(/Confirm Subscription Sync/i)).toBeInTheDocument();

    // Verify Escape key cancels dialog
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open dialog for execution test
    fireEvent.click(syncButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click confirm in modal
    const confirmButton = screen.getByRole("button", { name: /Confirm & Run/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(dashboardApi.syncSubscriptionStatuses).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Status sync complete: 2 expired, 1 queued passes promoted")
      );
    });

    // Verify dashboard data is refreshed after sync
    expect(dashboardApi.getAdminDashboard).toHaveBeenCalledTimes(2);
  });
});

