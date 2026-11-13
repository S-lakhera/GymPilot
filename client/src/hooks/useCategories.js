import { useState, useEffect, useCallback, useMemo } from "react";
import { categoryApi } from "../api/categoryApi.js";

/**
 * Custom hook for Plan Categories Workspace.
 * Handles category retrieval including inactive categories, creation, updates, and status toggles.
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryApi.listCategories({ includeInactive: true });
      setCategories(data || []);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const query = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const createCategory = useCallback(
    async (payload) => {
      setSubmitting(true);
      try {
        const result = await categoryApi.createCategory(payload);
        await fetchCategories();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchCategories]
  );

  const updateCategory = useCallback(
    async (id, payload) => {
      setSubmitting(true);
      try {
        const result = await categoryApi.updateCategory(id, payload);
        await fetchCategories();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchCategories]
  );

  const toggleCategoryStatus = useCallback(
    async (id, isActive) => {
      try {
        const result = await categoryApi.toggleCategoryStatus(id, isActive);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, is_active: isActive ? 1 : 0 } : c
          )
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  return {
    categories,
    filteredCategories,
    loading,
    submitting,
    error,
    search,
    setSearch,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    refetch: fetchCategories,
  };
}
