import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMembers } from "../useMembers.js";
import { userApi } from "../../api/userApi.js";

vi.mock("../../api/userApi.js", () => ({
  userApi: {
    listMembers: vi.fn(),
    getMemberById: vi.fn(),
    setMemberStatus: vi.fn(),
  },
}));

describe("useMembers hook", () => {
  const mockMembersResponse = {
    members: [
      {
        id: 1,
        first_name: "Rahul",
        last_name: "Verma",
        email: "rahul@gympilot.com",
        phone: "9876543210",
        is_active: 1,
        created_at: "2026-10-01",
      },
      {
        id: 2,
        first_name: "Ananya",
        last_name: "Sharma",
        email: "ananya@gympilot.com",
        phone: "9123456789",
        is_active: 0,
        created_at: "2026-10-05",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      totalRecords: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches members with default pagination on mount", async () => {
    userApi.listMembers.mockResolvedValueOnce(mockMembersResponse);

    const { result } = renderHook(() => useMembers());
    await act(async () => {});

    expect(userApi.listMembers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      status: "all",
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.members).toHaveLength(2);
    expect(result.current.pagination.totalRecords).toBe(2);
  });

  it("handles search and status filter updates and resets page", async () => {
    userApi.listMembers.mockResolvedValue(mockMembersResponse);

    const { result } = renderHook(() => useMembers());
    await act(async () => {});

    act(() => {
      result.current.setSearch("Rahul");
    });
    await act(async () => {});

    expect(userApi.listMembers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "Rahul",
      status: "all",
    });

    act(() => {
      result.current.setStatusFilter("active");
    });
    await act(async () => {});

    expect(userApi.listMembers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "Rahul",
      status: "active",
    });
  });

  it("opens member drawer and loads detailed profile", async () => {
    userApi.listMembers.mockResolvedValueOnce(mockMembersResponse);
    userApi.getMemberById.mockResolvedValueOnce({
      id: 1,
      firstName: "Rahul",
      lastName: "Verma",
      email: "rahul@gympilot.com",
      phone: "9876543210",
      isActive: true,
      profile: {
        gender: "male",
        emergency_contact_name: "Suresh Verma",
      },
    });

    const { result } = renderHook(() => useMembers());
    await act(async () => {});

    await act(async () => {
      await result.current.openDrawer(mockMembersResponse.members[0]);
    });

    expect(userApi.getMemberById).toHaveBeenCalledWith(1);
    expect(result.current.selectedMember.firstName).toBe("Rahul");
    expect(result.current.selectedMember.profile.emergency_contact_name).toBe("Suresh Verma");

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.selectedMember).toBeNull();
  });

  it("toggles member status and synchronizes members state", async () => {
    userApi.listMembers.mockResolvedValueOnce(mockMembersResponse);
    userApi.setMemberStatus.mockResolvedValueOnce({
      id: 1,
      email: "rahul@gympilot.com",
      isActive: false,
      message: "Account deactivated successfully",
    });

    const { result } = renderHook(() => useMembers());
    await act(async () => {});

    let res;
    await act(async () => {
      res = await result.current.setMemberStatus(1, false);
    });

    expect(userApi.setMemberStatus).toHaveBeenCalledWith(1, false);
    expect(res.message).toBe("Account deactivated successfully");
    expect(result.current.members[0].is_active).toBe(0);
  });
});

