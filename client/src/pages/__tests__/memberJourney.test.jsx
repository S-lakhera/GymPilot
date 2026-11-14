import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MemberDashboard } from "../member/MemberDashboard.jsx";
import { MemberPlanCatalog } from "../plans/MemberPlanCatalog.jsx";
import { MemberPassesPage } from "../member/MemberPassesPage.jsx";
import { ROUTES } from "../../utils/constants.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";
import { paymentApi } from "../../api/paymentApi.js";
import { dashboardApi } from "../../api/dashboardApi.js";

// Mock Auth
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: 5, firstName: "Sneha", role: "member" },
    isAuthenticated: true,
    role: "member",
  }),
}));

// Mock Toast
vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn() },
    showToast: vi.fn(),
  }),
}));

// Mock Network Status
vi.mock("../../hooks/useNetworkStatus.js", () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

// Mock APIs
vi.mock("../../api/dashboardApi.js", () => ({
  dashboardApi: {
    getMemberDashboard: vi.fn(),
  },
}));

vi.mock("../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn(),
    getPricingQuote: vi.fn(),
    checkoutSubscription: vi.fn(),
  },
}));

vi.mock("../../api/paymentApi.js", () => ({
  paymentApi: {
    confirmPayment: vi.fn(),
  },
}));

const mockMemberDashboardData = {
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
      daysRemaining: 5,
    },
  ],
  queuedRenewals: [],
  quickStats: {
    totalPassesCount: 1,
    activePassesCount: 1,
    daysUntilNextRenewal: 5,
  },
};

const mockPlans = [
  {
    id: 1,
    name: "Pro Strength 30",
    description: "Strength training 30 day pass.",
    price: 2499,
    durationDays: 30,
    categoryId: 1,
    categoryName: "Strength Training",
    isActive: true,
  },
  {
    id: 2,
    name: "Cardio Kickstart",
    description: "Cardio & HIIT floor access.",
    price: 1999,
    durationDays: 30,
    categoryId: 2,
    categoryName: "Cardio & HIIT",
    isActive: true,
  },
];

const mockCategories = [
  { id: 1, name: "Strength Training", planCount: 1 },
  { id: 2, name: "Cardio & HIIT", planCount: 1 },
];

vi.mock("../../hooks/usePlans.js", () => ({
  usePlans: () => ({
    categories: mockCategories,
    plans: mockPlans,
    filteredPlans: mockPlans,
    selectedCategoryId: null,
    setSelectedCategoryId: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

const mockPasses = [
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
    daysRemaining: 5,
  },
];

vi.mock("../../hooks/usePasses.js", () => ({
  usePasses: () => ({
    passes: mockPasses,
    filteredActive: mockPasses,
    filteredQueued: [],
    filteredPast: [],
    categories: ["Strength Training"],
    selectedCategory: null,
    setSelectedCategory: vi.fn(),
    counters: { active: 1, queued: 0, past: 0 },
    loading: false,
    cancelling: false,
    error: null,
    cancelPass: vi.fn(),
    refetch: vi.fn(),
  }),
}));

describe("Member Journey E2E Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardApi.getMemberDashboard.mockResolvedValue(mockMemberDashboardData);
    subscriptionApi.listSubscriptions.mockResolvedValue({ subscriptions: mockPasses });
    subscriptionApi.getPricingQuote.mockImplementation(async ({ planId, discountCode }) => ({
      planId,
      baseAmount: 1999,
      discountAmount: discountCode ? 399 : 0,
      taxAmount: discountCode ? 288 : 360,
      finalAmount: discountCode ? 1888 : 2359,
      currency: "INR",
    }));
  });

  afterEach(() => {
    cleanup();
  });

  function renderMemberFlow(initialRoute = ROUTES.DASHBOARD) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<MemberDashboard />} />
          <Route path={ROUTES.PLANS} element={<MemberPlanCatalog />} />
          <Route path={ROUTES.PASSES} element={<MemberPassesPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("completes member flow: Dashboard Overview ➔ Plan Catalog ➔ Open Checkout Modal ➔ Apply Promo Code ➔ Passes Workspace", async () => {
    // 1. Member arrives at Dashboard
    const { unmount: unmountDash } = renderMemberFlow(ROUTES.DASHBOARD);

    await waitFor(() => {
      expect(screen.getByText(/Welcome,\s*Sneha/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Pro Strength 30")).toBeInTheDocument();
    expect(screen.getByText(/5 Days Left/i)).toBeInTheDocument();

    unmountDash();

    // 2. Member navigates to Plans catalog
    const { unmount: unmountPlans } = renderMemberFlow(ROUTES.PLANS);

    await waitFor(() => {
      expect(screen.getByText("Cardio Kickstart")).toBeInTheDocument();
    });

    // 3. Initiate Checkout on Cardio Kickstart
    const buyButtons = screen.getAllByRole("button", { name: /Join Plan|Renew Pass/i });
    expect(buyButtons.length).toBeGreaterThan(0);

    fireEvent.click(buyButtons[1]); // Click second plan (Cardio Kickstart)

    // Verify CheckoutModal opens with accessible role
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const checkoutDialog = screen.getByRole("dialog");
    expect(within(checkoutDialog).getByRole("heading", { name: /Membership Checkout/i })).toBeInTheDocument();
    expect(within(checkoutDialog).getByText("Cardio Kickstart")).toBeInTheDocument();

    // Apply Coupon Code
    const couponInput = screen.getByPlaceholderText(/WELCOME10/i);
    const applyButton = screen.getByRole("button", { name: /Apply/i });

    fireEvent.change(couponInput, { target: { value: "PROMO20" } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(subscriptionApi.getPricingQuote).toHaveBeenCalledWith({
        planId: 2,
        discountCode: "PROMO20",
      });
    });

    // Verify Proceed to Payment button is available
    const proceedBtn = screen.getByRole("button", { name: /Proceed to Pay/i });
    expect(proceedBtn).toBeInTheDocument();
    expect(proceedBtn).not.toBeDisabled();

    // Close Modal
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    unmountPlans();

    // 4. Navigate to Member Passes Page
    renderMemberFlow(ROUTES.PASSES);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /My Gym Passes/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Active Passes").length).toBeGreaterThan(0);
  });
});
