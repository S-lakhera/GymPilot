import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicLandingPage } from "../PublicLandingPage.jsx";
import { PublicPlanCatalog } from "../plans/PublicPlanCatalog.jsx";
import { LoginPage } from "../auth/LoginPage.jsx";
import { RegisterPage } from "../auth/RegisterPage.jsx";
import { ROUTES } from "../../utils/constants.js";

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockShowToast = vi.fn();

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    role: null,
    login: mockLogin,
    register: mockRegister,
    sessionExpiredMessage: null,
    clearSessionExpiredNotice: vi.fn(),
  }),
}));

vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockPlans = [
  {
    id: 1,
    name: "Strength Builder 30",
    description: "Full barbell and machine access for 30 days.",
    price: 1999,
    durationDays: 30,
    categoryId: 1,
    categoryName: "Strength Training",
    isActive: true,
  },
  {
    id: 2,
    name: "Cardio Blitz 60",
    description: "Unlimited cardio floor and HIIT studio access.",
    price: 2499,
    durationDays: 60,
    categoryId: 2,
    categoryName: "Cardio",
    isActive: true,
  },
];

const mockCategories = [
  { id: 1, name: "Strength Training", planCount: 1 },
  { id: 2, name: "Cardio", planCount: 1 },
];

let selectedCategory = null;
vi.mock("../../hooks/usePlans.js", () => ({
  usePlans: () => ({
    categories: mockCategories,
    plans: mockPlans,
    filteredPlans: selectedCategory
      ? mockPlans.filter((p) => p.categoryId === selectedCategory)
      : mockPlans,
    selectedCategoryId: selectedCategory,
    setSelectedCategoryId: (id) => {
      selectedCategory = id;
    },
    isLoading: false,
    error: null,
  }),
}));

describe("Visitor Journey E2E Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedCategory = null;
  });

  afterEach(() => {
    cleanup();
  });

  function renderVisitorFlow(initialRoute = ROUTES.HOME) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path={ROUTES.HOME} element={<PublicLandingPage />} />
          <Route path={ROUTES.PLANS} element={<PublicPlanCatalog />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={<div data-testid="authenticated-dashboard">Welcome Member!</div>}
          />
        </Routes>
      </MemoryRouter>
    );
  }

  it("completes full guest discovery: Landing Page ➔ Browse Plans ➔ Select Plan ➔ Registration ➔ Sign In Navigation", async () => {
    // 1. Visitor arrives on Public Landing Page
    const { unmount: unmountLanding } = renderVisitorFlow(ROUTES.HOME);

    expect(
      screen.getByRole("heading", { name: /Elevate Your Gym Experience with/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Role-tailored interfaces for administrators/i)).toBeInTheDocument();

    // Verify CTAs for unauthenticated visitor
    const getStartedLink = screen.getByRole("link", { name: /Get Started Free/i });
    const signInLink = screen.getByRole("link", { name: /Member Sign In/i });
    expect(getStartedLink).toHaveAttribute("href", ROUTES.REGISTER);
    expect(signInLink).toHaveAttribute("href", ROUTES.LOGIN);

    unmountLanding();

    // 2. Visitor browses public membership plans
    const { unmount: unmountPlans } = renderVisitorFlow(ROUTES.PLANS);

    expect(
      screen.getByRole("heading", { name: /Flexible Gym Memberships Designed For Your Goals/i })
    ).toBeInTheDocument();

    // Both plans rendered with formatted prices and 'Join Now' CTAs
    expect(screen.getByText("Strength Builder 30")).toBeInTheDocument();
    expect(screen.getByText("Cardio Blitz 60")).toBeInTheDocument();
    const joinButtons = screen.getAllByRole("button", { name: /Join Now/i });
    expect(joinButtons.length).toBe(2);

    // Filter by Category
    const cardioChip = screen.getByRole("button", { name: /Cardio/i });
    fireEvent.click(cardioChip);

    // Click Join Now on the selected plan
    fireEvent.click(joinButtons[0]);

    unmountPlans();

    // 3. Verify Registration Page experience
    const { unmount: unmountRegister } = renderVisitorFlow(ROUTES.REGISTER);

    expect(screen.getByRole("heading", { name: /Create an Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();

    const switchSignInLink = screen.getByRole("link", { name: /Sign in/i });
    expect(switchSignInLink).toHaveAttribute("href", ROUTES.LOGIN);

    unmountRegister();

    // 4. Navigate to Login Page
    renderVisitorFlow(ROUTES.LOGIN);

    expect(
      screen.getByRole("heading", { name: /Sign in to GymPilot/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });
});
