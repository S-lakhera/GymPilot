import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminPlanManagement } from "../AdminPlanManagement.jsx";
import { planApi } from "../../../api/planApi.js";
import { categoryApi } from "../../../api/categoryApi.js";

vi.mock("../../../api/planApi.js", () => ({
  planApi: {
    listPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    togglePlanStatus: vi.fn(),
  },
}));

vi.mock("../../../api/categoryApi.js", () => ({
  categoryApi: {
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    toggleCategoryStatus: vi.fn(),
  },
}));

describe("AdminPlanManagement Page Component", () => {
  const mockPlans = [
    {
      id: 1,
      name: "Olympic Strength Monthly",
      description: "Free weights & racks access",
      category_id: 10,
      category_name: "Strength",
      duration_days: 30,
      price: 2499,
      is_active: 1,
    },
  ];

  const mockCategories = [
    {
      id: 10,
      name: "Strength",
      description: "Weight training and functional fitness",
      is_active: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header, plans tab, and plans table by default", async () => {
    planApi.listPlans.mockResolvedValueOnce(mockPlans);
    categoryApi.listCategories.mockResolvedValueOnce(mockCategories);

    render(<AdminPlanManagement />);

    expect(screen.getByText(/loading membership plans/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Plan & Category Management")).toBeInTheDocument();
      expect(screen.getByText("Olympic Strength Monthly")).toBeInTheDocument();
      expect(screen.getByText("₹2,499")).toBeInTheDocument();
    });
  });

  it("opens create plan modal and submits new plan successfully", async () => {
    planApi.listPlans
      .mockResolvedValueOnce(mockPlans)
      .mockResolvedValueOnce([...mockPlans, { id: 2, name: "HIIT Blast 15", price: 1200, duration_days: 15, is_active: 1 }]);
    categoryApi.listCategories.mockResolvedValueOnce(mockCategories);
    planApi.createPlan.mockResolvedValueOnce({ id: 2, name: "HIIT Blast 15" });

    render(<AdminPlanManagement />);

    await waitFor(() => {
      expect(screen.getByText("Olympic Strength Monthly")).toBeInTheDocument();
    });

    // Click "+ Create Membership Plan"
    const createBtn = screen.getByRole("button", { name: /\+ create membership plan/i });
    fireEvent.click(createBtn);

    // Verify modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create New Membership Plan")).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e\.g\. crossfit unlimited monthly/i);
    fireEvent.change(nameInput, { target: { value: "HIIT Blast 15" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /^create plan$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(planApi.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "HIIT Blast 15",
        })
      );
      expect(screen.getByText(/plan "HIIT Blast 15" created successfully/i)).toBeInTheDocument();
    });
  });

  it("switches to categories tab and creates a new workout category", async () => {
    planApi.listPlans.mockResolvedValueOnce(mockPlans);
    categoryApi.listCategories
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce([...mockCategories, { id: 20, name: "Yoga", description: "Mind & body", is_active: 1 }]);
    categoryApi.createCategory.mockResolvedValueOnce({ id: 20, name: "Yoga" });

    render(<AdminPlanManagement />);

    await waitFor(() => {
      expect(screen.getByText("Olympic Strength Monthly")).toBeInTheDocument();
    });

    // Click "Plan Categories" tab
    const catTabBtn = screen.getByRole("button", { name: /plan categories/i });
    fireEvent.click(catTabBtn);

    // Verify category rendered
    expect(screen.getByText("Weight training and functional fitness")).toBeInTheDocument();

    // Click "+ Create Workout Category"
    const createCatBtn = screen.getByRole("button", { name: /\+ create workout category/i });
    fireEvent.click(createCatBtn);

    // Verify modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Workout Category")).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e\.g\. strength training, pilates, yoga/i);
    fireEvent.change(nameInput, { target: { value: "Yoga" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /^create category$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(categoryApi.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Yoga",
        })
      );
      expect(screen.getByText(/category "Yoga" created successfully/i)).toBeInTheDocument();
    });
  });
});
