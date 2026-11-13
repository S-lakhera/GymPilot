import { useState, useEffect, useCallback, useMemo } from "react";
import { planApi } from "../api/planApi.js";

/**
 * Custom hook for Admin Plans Workspace.
 * Manages full plan lifecycle, filters, creation, modification, and status toggles.
 */
export function useAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await planApi.listPlans();
      setPlans(data || []);
    } catch (err) {
      setError(err.message || "Failed to load membership plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Derived filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // 1. Search term match
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = plan.name?.toLowerCase().includes(query);
        const matchesDesc = plan.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category match
      if (filterCategory !== "all") {
        if (String(plan.category_id) !== String(filterCategory)) return false;
      }

      // 3. Status filter match
      if (statusFilter === "active" && !plan.is_active) return false;
      if (statusFilter === "inactive" && plan.is_active) return false;

      return true;
    });
  }, [plans, search, filterCategory, statusFilter]);

  const createPlan = useCallback(
    async (payload) => {
      setSubmitting(true);
      try {
        const result = await planApi.createPlan(payload);
        await fetchPlans();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchPlans]
  );

  const updatePlan = useCallback(
    async (id, payload) => {
      setSubmitting(true);
      try {
        const result = await planApi.updatePlan(id, payload);
        await fetchPlans();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchPlans]
  );

  const togglePlanStatus = useCallback(
    async (id, isActive) => {
      try {
        const result = await planApi.togglePlanStatus(id, isActive);
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: isActive ? 1 : 0 } : p))
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  return {
    plans,
    filteredPlans,
    loading,
    submitting,
    error,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    statusFilter,
    setStatusFilter,
    createPlan,
    updatePlan,
    togglePlanStatus,
    refetch: fetchPlans,
  };
}

