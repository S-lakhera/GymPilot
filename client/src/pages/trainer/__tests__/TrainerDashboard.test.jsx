import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TrainerDashboard } from "../TrainerDashboard.jsx";
import { dashboardApi } from "../../../api/dashboardApi.js";

vi.mock("../../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: 3, firstName: "Alex", role: "trainer", isActive: true },
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
    getTrainerDashboard: vi.fn(),
  },
}));

const mockTrainerData = {
  profile: {
    user_id: 3,
    full_name: "Alex Fernandes",
    email: "alex.trainer@gympilot.com",
    phone: "+919876500000",
    is_active: 1,
    specialization: "Hypertrophy & Conditioning",
    experience_years: 7,
    certification: "CSCS, NSCA-CPT",
    bio: "Dedicated to progressive overload and form integrity.",
    monthly_salary: "45000.00",
  },
  totalAssignedMembers: 0,
  assignedMembers: [],
  upcomingSessions: [],
};

describe("TrainerDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trainer credentials, accurate account status, and Phase 6 roadmap placeholders", async () => {
    dashboardApi.getTrainerDashboard.mockResolvedValueOnce(mockTrainerData);

    render(
      <BrowserRouter>
        <TrainerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hello, Coach Alex/i)).toBeInTheDocument();
    });

    // Account status assertion (Active Account vs absent Active Duty)
    expect(screen.getAllByText("Active Account").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Active Duty/i)).not.toBeInTheDocument();

    // Profile details
    expect(screen.getByText("Alex Fernandes")).toBeInTheDocument();
    expect(screen.getByText("alex.trainer@gympilot.com")).toBeInTheDocument();
    expect(screen.getByText("+919876500000")).toBeInTheDocument();
    expect(screen.getByText(/Hypertrophy & Conditioning/i)).toBeInTheDocument();
    expect(screen.getByText("7 Years")).toBeInTheDocument();
    expect(screen.getByText("CSCS, NSCA-CPT")).toBeInTheDocument();

    // Phase 6 placeholders
    expect(screen.getByText(/Assigned Client Roster/i)).toBeInTheDocument();
    expect(screen.getByText(/Coaching Schedule & Sessions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Phase 6 Roadmap/i).length).toBe(2);

    // Schedule link marked with Preview / probe indication
    expect(screen.getByText(/Schedule Probe/i)).toBeInTheDocument();
    expect(screen.getByText(/(Preview)/i)).toBeInTheDocument();
  });
});
