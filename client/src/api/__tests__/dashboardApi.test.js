import { describe, it, expect, vi, beforeEach } from "vitest";
import { dashboardApi } from "../dashboardApi.js";
import { axiosClient } from "../axiosClient.js";

vi.mock("../axiosClient.js", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("dashboardApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAdminDashboard calls /dashboard/admin and unwraps JSend envelope", async () => {
    const mockData = {
      membership: { totalMembers: 10, activeMembers: 8, activeTrainers: 2 },
      financials: { netRevenue: 40000 },
    };
    axiosClient.get.mockResolvedValueOnce({
      data: {
        status: "success",
        data: mockData,
        message: "Admin dashboard metrics retrieved successfully.",
      },
    });

    const result = await dashboardApi.getAdminDashboard();

    expect(axiosClient.get).toHaveBeenCalledWith("/dashboard/admin");
    expect(result.membership).toEqual(mockData.membership);
    expect(result.financials.netRevenue).toBe(40000);
    expect(result.message).toContain("Admin dashboard");
  });

  it("getTrainerDashboard calls /dashboard/trainer and unwraps JSend envelope", async () => {
    const mockData = {
      profile: { full_name: "Coach Alex", specialization: "Strength" },
      totalAssignedMembers: 0,
    };
    axiosClient.get.mockResolvedValueOnce({
      data: {
        status: "success",
        data: mockData,
        message: "Trainer dashboard metrics retrieved successfully.",
      },
    });

    const result = await dashboardApi.getTrainerDashboard();

    expect(axiosClient.get).toHaveBeenCalledWith("/dashboard/trainer");
    expect(result.profile.full_name).toBe("Coach Alex");
    expect(result.totalAssignedMembers).toBe(0);
  });

  it("getMemberDashboard calls /dashboard/member and unwraps JSend envelope", async () => {
    const mockData = {
      activePasses: [{ subscriptionId: 1, planName: "Pro Strength" }],
      profileCompleteness: { percentage: 80, totalFields: 5 },
    };
    axiosClient.get.mockResolvedValueOnce({
      data: {
        status: "success",
        data: mockData,
        message: "Member dashboard metrics retrieved successfully.",
      },
    });

    const result = await dashboardApi.getMemberDashboard();

    expect(axiosClient.get).toHaveBeenCalledWith("/dashboard/member");
    expect(result.activePasses).toHaveLength(1);
    expect(result.profileCompleteness.totalFields).toBe(5);
  });

  it("syncSubscriptionStatuses calls POST /subscriptions/sync-statuses and unwraps counts", async () => {
    const mockCounts = {
      expiredSubscriptions: 3,
      activatedQueuedSubscriptions: 1,
      purgedStaleSubscriptions: 0,
      purgedStalePayments: 0,
    };
    axiosClient.post.mockResolvedValueOnce({
      data: {
        status: "success",
        data: mockCounts,
        message: "Subscription statuses synchronized successfully.",
      },
    });

    const result = await dashboardApi.syncSubscriptionStatuses();

    expect(axiosClient.post).toHaveBeenCalledWith("/subscriptions/sync-statuses");
    expect(result.expiredSubscriptions).toBe(3);
    expect(result.activatedQueuedSubscriptions).toBe(1);
  });

  it("normalizes API errors cleanly when network fails", async () => {
    axiosClient.get.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: "FORBIDDEN",
          message: "Access forbidden.",
        },
      },
    });

    await expect(dashboardApi.getAdminDashboard()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Access forbidden.",
      status: 403,
    });
  });
});

