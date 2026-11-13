import { useState, useEffect, useCallback, useMemo } from "react";
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

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discountApi.listDiscounts({ limit: 100 });
      setDiscounts(res.discounts || []);
    } catch (err) {
      setError(err.message || "Failed to load discount coupons.");
    } finally {
      setLoading(false);
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
    [fetchDiscounts]
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
    [fetchDiscounts]
  );

  const toggleDiscountStatus = useCallback(
    async (id, isActive) => {
      try {
        const result = await discountApi.toggleDiscountStatus(id, isActive);
        setDiscounts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_active: isActive ? 1 : 0 } : d))
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    []
  );

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
