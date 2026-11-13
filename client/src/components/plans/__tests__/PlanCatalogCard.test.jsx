import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlanCatalogCard } from "../PlanCatalogCard.jsx";

describe("PlanCatalogCard Component", () => {
  const mockPlan = {
    id: 1,
    name: "Pro Strength 90",
    category_id: 1,
    category_name: "Strength Training",
    duration_days: 90,
    price: 5499,
    description: "Full access to strength zones and free weights.",
  };

  it("renders plan details, formatted currency, and 'Join Now' for unauthenticated guests", () => {
    const onSelectMock = vi.fn();
    render(
      <PlanCatalogCard
        plan={mockPlan}
        isAuthenticated={false}
        onSelectPlan={onSelectMock}
      />,
    );

    expect(screen.getByText("Pro Strength 90")).toBeInTheDocument();
    expect(screen.getByText("Strength Training")).toBeInTheDocument();
    expect(screen.getByText("90 Days Pass")).toBeInTheDocument();
    expect(screen.getByText(/₹\s?5,499/)).toBeInTheDocument();

    const joinBtn = screen.getByRole("button", { name: /Join Now/i });
    expect(joinBtn).toBeInTheDocument();
    fireEvent.click(joinBtn);
    expect(onSelectMock).toHaveBeenCalledWith(mockPlan);
  });

  it("renders 'Renew Pass' and active category badge when member holds an active pass in category", () => {
    const activePasses = [
      { id: 10, category_id: 1, status: "active", end_date: "2026-12-01" },
    ];
    render(
      <PlanCatalogCard
        plan={mockPlan}
        memberActivePasses={activePasses}
        isAuthenticated={true}
        role="member"
        onSelectPlan={vi.fn()}
      />,
    );

    expect(screen.getByText(/Current Active Category/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Renew Pass/i }),
    ).toBeInTheDocument();
  });

  it("disables CTA with 'Renewal Queued' when member already has a queued pass in category", () => {
    const activePasses = [
      { id: 10, category_id: 1, status: "active" },
      { id: 11, category_id: 1, status: "queued" },
    ];
    render(
      <PlanCatalogCard
        plan={mockPlan}
        memberActivePasses={activePasses}
        isAuthenticated={true}
        role="member"
        onSelectPlan={vi.fn()}
      />,
    );

    expect(screen.getByText(/Renewal Scheduled/i)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Renewal Queued/i });
    expect(btn).toBeDisabled();
  });
});
