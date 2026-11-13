import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { discountApi } from "../api/discountApi.js";

/**
 * Custom hook for Admin Promotional Discounts Workspace.
 * Manages coupon retrieval, filtering, creation, modification, and status toggles.
 */
export function useDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const requestIdRef = useRef(0);

  const fetchDiscounts = useCallback(async () => {
    const currentReqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      let allDiscounts = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const res = await discountApi.listDiscounts({
          page: currentPage,
          limit: 100,
        });
        const batch = res.discounts || [];
        allDiscounts = allDiscounts.concat(batch);
        totalPages = res.pagination?.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      if (currentReqId === requestIdRef.current) {
        setDiscounts(allDiscounts);
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setError(err.message || "Failed to load discount coupons.");
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const codeMatch = d.code?.toLowerCase().includes(query);
        const nameMatch = d.name?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch) return false;
      }

      if (statusFilter === "active" && !d.is_active) return false;
      if (statusFilter === "inactive" && d.is_active) return false;

      return true;
    });
  }, [discounts, search, statusFilter]);

  const createDiscount = useCallback(
    async (payload) => {
      setSubmitting(true);
      try {
        const result = await discountApi.createDiscount(payload);
        await fetchDiscounts();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchDiscounts],
  );

  const updateDiscount = useCallback(
    async (id, payload) => {
      setSubmitting(true);
      try {
        const result = await discountApi.updateDiscount(id, payload);
        await fetchDiscounts();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchDiscounts],
  );

  const toggleDiscountStatus = useCallback(async (id, isActive) => {
    try {
      const result = await discountApi.toggleDiscountStatus(id, isActive);
      setDiscounts((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, is_active: isActive ? 1 : 0 } : d,
        ),
      );
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    discounts,
    filteredDiscounts,
    loading,
    submitting,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createDiscount,
    updateDiscount,
    toggleDiscountStatus,
    refetch: fetchDiscounts,
  };
}
