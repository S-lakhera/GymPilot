import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { MembersManagementPage } from "../MembersManagementPage.jsx";
import { userApi } from "../../../api/userApi.js";
import { subscriptionApi } from "../../../api/subscriptionApi.js";

vi.mock("../../../api/userApi.js", () => ({
  userApi: {
    listMembers: vi.fn(),
    getMemberById: vi.fn(),
    setMemberStatus: vi.fn(),
  },
}));

vi.mock("../../../api/subscriptionApi.js", () => ({
  subscriptionApi: {
    listSubscriptions: vi.fn().mockResolvedValue({ subscriptions: [] }),
  },
}));

describe("MembersManagementPage Component", () => {
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
    {
      id: 502,
      first_name: "Sneha",
      last_name: "Rao",
      email: "sneha.rao@gympilot.com",
      phone: "9123456789",
      is_active: 0,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      created_at: "2026-10-20",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders member directory title, search filter, and members table", async () => {
    userApi.listMembers.mockResolvedValueOnce({
      members: mockMembers,
      pagination: {
        page: 1,
        limit: 10,
        totalRecords: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    render(
      <BrowserRouter>
        <MembersManagementPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading member directory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Member Directory & Accounts")).toBeInTheDocument();
    });

    // Check members rendered in table
    expect(screen.getByText("Amit Patel")).toBeInTheDocument();
    expect(screen.getByText("amit.patel@gympilot.com")).toBeInTheDocument();
    expect(screen.getByText("Sneha Rao")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
  });

  it("opens slide-over drawer when clicking View button", async () => {
    userApi.listMembers.mockResolvedValueOnce({
      members: mockMembers,
      pagination: { page: 1, limit: 10, totalRecords: 2, totalPages: 1 },
    });
    userApi.getMemberById.mockResolvedValueOnce({
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
    });

    render(
      <BrowserRouter>
        <MembersManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Amit Patel")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole("button", { name: /^view$/i });
    fireEvent.click(viewButtons[0]);

    // Drawer should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Mild asthma")).toBeInTheDocument();
    });

    // Close drawer
    const closeBtn = screen.getByRole("button", { name: /close drawer/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Mild asthma")).not.toBeInTheDocument();
    });
  });

  it("toggles member status with confirmation modal", async () => {
    userApi.listMembers.mockResolvedValueOnce({
      members: mockMembers,
      pagination: { page: 1, limit: 10, totalRecords: 2, totalPages: 1 },
    });
    userApi.setMemberStatus.mockResolvedValueOnce({
      id: 501,
      email: "amit.patel@gympilot.com",
      isActive: false,
      message: "Account deactivated successfully",
    });

    render(
      <BrowserRouter>
        <MembersManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Amit Patel")).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByRole("button", { name: /^deactivate$/i });
    fireEvent.click(deactivateBtn);

    // Modal opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/deactivate member account\?/i)).toBeInTheDocument();

    // Confirm deactivation
    const confirmBtn = screen.getByRole("button", { name: /yes, deactivate/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(userApi.setMemberStatus).toHaveBeenCalledWith(501, false);
      expect(screen.getByText(/account deactivated successfully/i)).toBeInTheDocument();
    });
  });
});
