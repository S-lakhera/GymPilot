import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminDashboard } from "../admin/AdminDashboard.jsx";
import { MembersManagementPage } from "../admin/MembersManagementPage.jsx";
import { PaymentsManagementPage } from "../admin/PaymentsManagementPage.jsx";
import { DiscountsManagementPage } from "../admin/DiscountsManagementPage.jsx";
import { ROUTES } from "../../utils/constants.js";
import { dashboardApi } from "../../api/dashboardApi.js";
import { userApi } from "../../api/userApi.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";
import { paymentApi } from "../../api/paymentApi.js";
import { refundApi } from "../../api/refundApi.js";
import { discountApi } from "../../api/discountApi.js";

// Mock Auth
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: 1, firstName: "Vikram", role: "admin" },
    isAuthenticated: true,
    role: "admin",
  }),
}));

// Mock Toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    toast: mockToast,
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
    getAdminDashboard: vi.fn(),
    syncSubscriptionStatuses: vi.fn(),
  },
}));

vi.mock("../../api/userApi.js", () => ({
  userApi: {
    listMembers: vi.fn(),
    getMemberById: vi.fn(),
    setMemberStatus: vi.fn(),
  },
}));

vi.mock("../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn(),
  },
}));

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

vi.mock("../../api/discountApi.js", () => ({
  discountApi: {
    listDiscounts: vi.fn(),
    createDiscount: vi.fn(),
    updateDiscount: vi.fn(),
    deleteDiscount: vi.fn(),
  },
}));

const mockAdminDashboard = {
  membership: {
    totalMembers: 42,
    activeMembers: 38,
    activeTrainers: 6,
  },
  subscriptions: {
    activeSubscriptions: 35,
    queuedSubscriptions: 5,
    expiringSoon: 4,
    expiredSubscriptions: 12,
  },
  financials: {
    grossRevenue: 145000,
    grossRevenueMtd: 45000,
    grossRevenueToday: 6500,
    netRevenue: 142000,
    refundsTotal: 3000,
    refundsMtd: 800,
    refundsToday: 0,
  },
  dailyAttendance: [],
  expiringMembers: [],
  recentActivity: [],
};

const mockMembers = [
  {
    id: 501,
    first_name: "Amit",
    last_name: "Patel",
    email: "amit.patel@gympilot.com",
    phone: "9876543210",
    is_active: 1,
    emergency_contact_name: "Kiran Patel",
    emergency_contact_phone: "9876500000",
    created_at: "2026-10-15",
  },
];

const mockMemberDetail = {
  id: 501,
  firstName: "Amit",
  lastName: "Patel",
  email: "amit.patel@gympilot.com",
  phone: "9876543210",
  isActive: true,
  profile: {
    gender: "male",
    emergency_contact_name: "Kiran Patel",
    health_conditions: "Mild asthma",
  },
};

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

const mockDiscounts = [
  {
    id: 1,
    code: "SAVE20",
    name: "Winter Kickoff 20% Off",
    description: "20% off all monthly plans",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountAmount: 500,
    minPurchaseAmount: 1000,
    startDate: "2026-11-01",
    endDate: "2026-12-01",
    usageLimit: 100,
    timesUsed: 14,
    isActive: true,
  },
];

describe("Admin Journey E2E Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardApi.getAdminDashboard.mockResolvedValue(mockAdminDashboard);
    userApi.listMembers.mockResolvedValue({
      members: mockMembers,
      pagination: { page: 1, limit: 10, totalRecords: 1, totalPages: 1, hasNext: false, hasPrev: false },
    });
    userApi.getMemberById.mockResolvedValue(mockMemberDetail);
    subscriptionApi.listSubscriptions.mockResolvedValue({ subscriptions: [] });
    paymentApi.listAllPayments.mockResolvedValue({
      payments: mockPayments,
      pagination: { page: 1, limit: 10, totalRecords: 1, totalPages: 1 },
    });
    refundApi.listRefunds.mockResolvedValue({
      refunds: [],
      pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
    });
    discountApi.listDiscounts.mockResolvedValue({
      discounts: mockDiscounts,
      pagination: { page: 1, limit: 10, totalRecords: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  function renderAdminFlow(initialRoute = ROUTES.DASHBOARD) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.MEMBERS} element={<MembersManagementPage />} />
          <Route path={ROUTES.PAYMENTS} element={<PaymentsManagementPage />} />
          <Route path={ROUTES.DISCOUNTS} element={<DiscountsManagementPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("completes full admin workflow: Executive Dashboard ➔ Member Drawer Inspection ➔ Status Modal ➔ Payments & Refund Modal ➔ Discounts Creation Modal", async () => {
    // 1. Admin lands on Executive Dashboard
    const { unmount: unmountDash } = renderAdminFlow(ROUTES.DASHBOARD);

    await waitFor(() => {
      expect(screen.getByText(/Executive Management Console/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, Vikram/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Active Members")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText(/Total Roster:\s*42/i)).toBeInTheDocument();

    unmountDash();

    // 2. Admin navigates to Member Directory
    const { unmount: unmountMembers } = renderAdminFlow(ROUTES.MEMBERS);

    await waitFor(() => {
      expect(screen.getByText("Member Directory & Accounts")).toBeInTheDocument();
    });

    expect(screen.getByText("Amit Patel")).toBeInTheDocument();

    // Open Member Detail Slide-Over Drawer
    const viewBtn = screen.getByRole("button", { name: /^view$/i });
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText(/Member Profile/i)).toBeInTheDocument();
    });

    // Check that drawer rendered with right positioning and slide animation
    const drawerPanel = screen.getByText(/Member Profile/i).closest('.animate-drawer-slide-right');
    expect(drawerPanel).toBeInTheDocument();

    const drawerBackdrop = screen.getByRole("dialog", { name: /Amit Patel/i });
    expect(drawerBackdrop).toHaveClass("top-16");
    expect(drawerBackdrop).toHaveClass("z-40");

    // Click Deactivate Account inside the drawer
    const deactivateDrawerBtn = screen.getByRole("button", { name: /Deactivate Account/i });
    fireEvent.click(deactivateDrawerBtn);

    // MemberStatusToggleModal appears
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Deactivate Member Account/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Deactivate Member Account\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yes, Deactivate/i })).toBeInTheDocument();

    // Close status modal
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    unmountMembers();

    // 3. Admin navigates to Payments Ledger
    const { unmount: unmountPayments } = renderAdminFlow(ROUTES.PAYMENTS);

    await waitFor(() => {
      expect(screen.getByText("Financial Ledger & Refund Hub")).toBeInTheDocument();
    });

    expect(screen.getByText("TXN_SIM_8877")).toBeInTheDocument();
    expect(screen.getByText("Vikram Malhotra")).toBeInTheDocument();

    // Open Issue Refund Modal
    const refundBtn = screen.getByRole("button", { name: /Issue Refund/i });
    fireEvent.click(refundBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Issue Payment Refund/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Confirm Refund/i })).toBeInTheDocument();

    // Close refund modal
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    unmountPayments();

    // 4. Admin navigates to Discounts Management
    renderAdminFlow(ROUTES.DISCOUNTS);

    await waitFor(() => {
      expect(screen.getByText("Promotional Discounts & Coupons")).toBeInTheDocument();
    });

    expect(screen.getByText("SAVE20")).toBeInTheDocument();
    expect(screen.getByText("Winter Kickoff 20% Off")).toBeInTheDocument();

    // Open Create Coupon Modal
    const createCouponBtn = screen.getByRole("button", { name: /\+ Create Coupon Code|Create Coupon/i });
    fireEvent.click(createCouponBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /Create Promotional Coupon/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. SUMMER25/i)).toBeInTheDocument();
  });
});
