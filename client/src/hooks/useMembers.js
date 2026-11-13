import { useState, useEffect, useCallback } from "react";
import { userApi } from "../api/userApi.js";

/**
 * Custom hook for Admin Member Directory.
 * Provides member listing, pagination, search, status filtering,
 * slide-over drawer inspection, and account activation/deactivation.
 */
export function useMembers({ initialLimit = 10 } = {}) {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    totalRecords: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination parameters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  // Slide-over drawer state
  const [selectedMember, setSelectedMember] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState(null);

  // Status toggle in progress
  const [togglingStatusId, setTogglingStatusId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.listMembers({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter,
      });

      setMembers(response.members || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load members list.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Open drawer and load complete details
  const openDrawer = useCallback(async (member) => {
    setSelectedMember(member);
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const detailed = await userApi.getMemberById(member.id);
      setSelectedMember(detailed);
    } catch (err) {
      setDrawerError(err.message || "Failed to load full member details.");
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedMember(null);
    setDrawerError(null);
  }, []);

  // Activate or deactivate member
  const setMemberStatus = useCallback(
    async (id, isActive) => {
      setTogglingStatusId(id);
      try {
        const result = await userApi.setMemberStatus(id, isActive);
        // Synchronize local table list
        setMembers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, is_active: isActive ? 1 : 0 } : m
          )
        );
        // Synchronize drawer if open for this member
        setSelectedMember((prev) =>
          prev && prev.id === id ? { ...prev, isActive } : prev
        );
        return result;
      } catch (err) {
        throw err;
      } finally {
        setTogglingStatusId(null);
      }
    },
    []
  );

  return {
    members,
    pagination,
    loading,
    error,
    search,
    setSearch: (val) => {
      setSearch(val);
      setPage(1); // Reset to page 1 on new search
    },
    statusFilter,
    setStatusFilter: (val) => {
      setStatusFilter(val);
      setPage(1); // Reset to page 1 on filter change
    },
    page,
    setPage,
    selectedMember,
    drawerLoading,
    drawerError,
    openDrawer,
    closeDrawer,
    togglingStatusId,
    setMemberStatus,
    refetch: fetchMembers,
  };
}

