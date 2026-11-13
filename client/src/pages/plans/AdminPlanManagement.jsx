import React, { useState } from "react";
import { useAdminPlans } from "../../hooks/useAdminPlans.js";
import { useCategories } from "../../hooks/useCategories.js";
import { AdminPlanTable } from "../../components/plans/AdminPlanTable.jsx";
import { AdminCategoryTable } from "../../components/plans/AdminCategoryTable.jsx";
import { PlanFormModal } from "../../components/plans/PlanFormModal.jsx";
import { CategoryFormModal } from "../../components/plans/CategoryFormModal.jsx";

/**
 * Admin Plans & Categories Workspace.
 * Full CRUD, category filtering, and status toggle governance.
 */
export function AdminPlanManagement() {
  const [activeTab, setActiveTab] = useState("plans"); // "plans" | "categories"

  // Admin Plans Hook
  const {
    plans,
    filteredPlans,
    loading: loadingPlans,
    submitting: submittingPlan,
    error: planError,
    search: planSearch,
    setSearch: setPlanSearch,
    filterCategory,
    setFilterCategory,
    statusFilter,
    setStatusFilter,
    createPlan,
    updatePlan,
    togglePlanStatus,
    refetch: refetchPlans,
  } = useAdminPlans();

  // Categories Hook
  const {
    categories,
    filteredCategories,
    loading: loadingCategories,
    submitting: submittingCategory,
    error: categoryError,
    search: categorySearch,
    setSearch: setCategorySearch,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    refetch: refetchCategories,
  } = useCategories();

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  // Global feedback notification
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Handlers for Plan CRUD
  const handleOpenCreatePlan = () => {
    setPlanToEdit(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setPlanToEdit(plan);
    setIsPlanModalOpen(true);
  };

  const handleSubmitPlan = async (formData) => {
    try {
      if (planToEdit) {
        await updatePlan(planToEdit.id, formData);
        setFeedback({
          type: "success",
          message: `Plan "${formData.name}" updated successfully.`,
        });
      } else {
        await createPlan(formData);
        setFeedback({
          type: "success",
          message: `Plan "${formData.name}" created successfully.`,
        });
      }
      setIsPlanModalOpen(false);
      setPlanToEdit(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save membership plan.",
      });
    }
  };

  const handleTogglePlan = async (plan) => {
    const nextState = !Boolean(plan.is_active);
    try {
      await togglePlanStatus(plan.id, nextState);
      setFeedback({
        type: "success",
        message: `Plan "${plan.name}" is now ${nextState ? "active" : "deactivated"}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update plan status.",
      });
    }
  };

  // Handlers for Category CRUD
  const handleOpenCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category) => {
    setCategoryToEdit(category);
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (formData) => {
    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, formData);
        setFeedback({
          type: "success",
          message: `Category "${formData.name}" updated successfully.`,
        });
      } else {
        await createCategory(formData);
        setFeedback({
          type: "success",
          message: `Category "${formData.name}" created successfully.`,
        });
      }
      setIsCategoryModalOpen(false);
      setCategoryToEdit(null);
      // Synchronize plan categories
      await refetchPlans();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save category.",
      });
    }
  };

  const handleToggleCategory = async (category) => {
    const nextState = !Boolean(category.is_active);
    try {
      await toggleCategoryStatus(category.id, nextState);
      setFeedback({
        type: "success",
        message: `Category "${category.name}" is now ${nextState ? "active" : "deactivated"}.`,
      });
      // Synchronize plans
      await refetchPlans();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update category status.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/20">
            Admin Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
            Plan & Category Management
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure workout categories, membership pricing tiers, and active status toggles.
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          {activeTab === "plans" ? (
            <button
              type="button"
              onClick={handleOpenCreatePlan}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
            >
              + Create Membership Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateCategory}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
            >
              + Create Workout Category
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75 text-sm font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Global Errors */}
      {(planError || categoryError) && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-center justify-between">
          <span>{planError || categoryError}</span>
          <button
            type="button"
            onClick={() => {
              refetchPlans();
              refetchCategories();
            }}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "plans"
              ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <span>Membership Plans</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "plans" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "categories"
              ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <span>Plan Categories</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "categories" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Membership Plans */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          {/* Plans Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder="Search plans by name or description..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {planSearch && (
                <button
                  type="button"
                  onClick={() => setPlanSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Dropdown & Status Chips */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-emerald-500 text-zinc-950 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === "active"
                      ? "bg-emerald-500 text-zinc-950 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === "inactive"
                      ? "bg-zinc-700 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loadingPlans ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              Loading membership plans...
            </div>
          ) : (
            <AdminPlanTable
              plans={filteredPlans}
              onEditPlan={handleOpenEditPlan}
              onToggleStatus={handleTogglePlan}
            />
          )}
        </div>
      )}

      {/* Tab 2: Workout Categories */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories by name or description..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700/50">
              {filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {/* Table */}
          {loadingCategories ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              Loading workout categories...
            </div>
          ) : (
            <AdminCategoryTable
              categories={filteredCategories}
              onEditCategory={handleOpenEditCategory}
              onToggleStatus={handleToggleCategory}
            />
          )}
        </div>
      )}

      {/* Plan Create / Edit Modal */}
      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setPlanToEdit(null);
        }}
        onSubmit={handleSubmitPlan}
        planToEdit={planToEdit}
        categories={categories}
        submitting={submittingPlan}
      />

      {/* Category Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSubmit={handleSubmitCategory}
        categoryToEdit={categoryToEdit}
        submitting={submittingCategory}
      />
    </div>
  );
}

export default AdminPlanManagement;
