import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { PlansDispatcher } from "../PlansDispatcher.jsx";
import { USER_ROLES } from "../../../utils/constants.js";

const mockUseAuth = vi.fn();
vi.mock("../../../hooks/useAuth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../../hooks/usePlans.js", () => ({
  usePlans: () => ({
    plans: [
      { id: 1, name: "Sample Plan", price: 1999, category_name: "Strength" },
    ],
    categories: [{ id: 1, name: "Strength" }],
    filteredPlans: [
      { id: 1, name: "Sample Plan", price: 1999, category_name: "Strength" },
    ],
    selectedCategoryId: "all",
    setSelectedCategoryId: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn().mockResolvedValue({ subscriptions: [] }),
  },
}));

describe("PlansDispatcher Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PublicPlanCatalog for unauthenticated visitors", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      role: null,
    });

    render(
      <BrowserRouter>
        <PlansDispatcher />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Flexible Gym Memberships Designed For Your Goals/i),
    ).toBeInTheDocument();
  });

  it("renders MemberPlanCatalog for authenticated members", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: USER_ROLES.MEMBER,
      user: { firstName: "Aarav" },
    });

    render(
      <BrowserRouter>
        <PlansDispatcher />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Plan Catalog & Renewals/i)).toBeInTheDocument();
  });

  it("renders AdminPlanManagement for authenticated administrators", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: USER_ROLES.ADMIN,
      user: { firstName: "Vikram" },
    });

    render(
      <BrowserRouter>
        <PlansDispatcher />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Plan & Category Management/i)).toBeInTheDocument();
  });
});
