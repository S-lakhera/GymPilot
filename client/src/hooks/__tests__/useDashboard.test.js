import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDashboard } from "../useDashboard.js";
import { dashboardApi } from "../../api/dashboardApi.js";
import { USER_ROLES } from "../../utils/constants.js";

const mockUseAuth = vi.fn();
vi.mock("../useAuth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../api/dashboardApi.js", () => ({
  dashboardApi: {
    getAdminDashboard: vi.fn(),
    getTrainerDashboard: vi.fn(),
    getMemberDashboard: vi.fn(),
    syncSubscriptionStatuses: vi.fn(),
  },
}));

describe("useDashboard Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches admin metrics on mount and does NOT invoke syncSubscriptionStatuses", async () => {
    mockUseAuth.mockReturnValue({
      role: USER_ROLES.ADMIN,
      isAuthenticated: true,
    });

    const mockAdminData = {
      membership: { totalMembers: 12 },
      financials: { netRevenue: 45000 },
    };
    dashboardApi.getAdminDashboard.mockResolvedValueOnce(mockAdminData);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(dashboardApi.getAdminDashboard).toHaveBeenCalledTimes(1);
    // Explicitly verify subscription sync was NOT called
    expect(dashboardApi.syncSubscriptionStatuses).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(mockAdminData);
    expect(result.current.error).toBeNull();
  });

  it("fetches member metrics when authenticated role is member", async () => {
    mockUseAuth.mockReturnValue({
      role: USER_ROLES.MEMBER,
      isAuthenticated: true,
    });

    const mockMemberData = {
      activePasses: [{ subscriptionId: 5 }],
    };
    dashboardApi.getMemberDashboard.mockResolvedValueOnce(mockMemberData);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(dashboardApi.getMemberDashboard).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockMemberData);
  });

  it("handles fetch failure gracefully and sets error state", async () => {
    mockUseAuth.mockReturnValue({
      role: USER_ROLES.TRAINER,
      isAuthenticated: true,
    });

    const errorObj = { message: "Failed to connect", status: 500 };
    dashboardApi.getTrainerDashboard.mockRejectedValueOnce(errorObj);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(errorObj);
    expect(result.current.data).toBeNull();
  });

  it("refresh() triggers manual refetch with isRefreshing state", async () => {
    mockUseAuth.mockReturnValue({
      role: USER_ROLES.ADMIN,
      isAuthenticated: true,
    });

    dashboardApi.getAdminDashboard.mockResolvedValueOnce({ initial: true });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    dashboardApi.getAdminDashboard.mockResolvedValueOnce({ refreshed: true });

    act(() => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.data).toEqual({ refreshed: true });
    expect(dashboardApi.syncSubscriptionStatuses).not.toHaveBeenCalled();
  });

  it("cancels state updates cleanly upon unmount", async () => {
    mockUseAuth.mockReturnValue({
      role: USER_ROLES.ADMIN,
      isAuthenticated: true,
    });

    let resolvePromise;
    dashboardApi.getAdminDashboard.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
    unmount();

    // Resolving after unmount should not throw or cause warning
    resolvePromise({ afterUnmount: true });
  });
});
