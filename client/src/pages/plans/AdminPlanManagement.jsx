import React, { useState } from "react";
import { Layers, Plus, Dumbbell, Shield, Loader2, RefreshCw } from "lucide-react";
import { useAdminPlans } from "../../hooks/useAdminPlans.js";
import { useCategories } from "../../hooks/useCategories.js";
import { AdminPlanTable } from "../../components/plans/AdminPlanTable.jsx";
import { AdminCategoryTable } from "../../components/plans/AdminCategoryTable.jsx";
import { PlanFormModal } from "../../components/plans/PlanFormModal.jsx";
import { CategoryFormModal } from "../../components/plans/CategoryFormModal.jsx";

/**
 * Admin Plans & Categories Workspace.
 * Dispatched under /plans for Administrators.
 */
export function AdminPlanManagement() {
  const [activeTab, setActiveTab] = useState("plans");

  const {
    plans,
    filteredPlans,
    loading: plansLoading,
    error: plansError,
    createPlan,
    updatePlan,
    togglePlanStatus,
    submitting: planSubmitting,
    refetch: refetchPlans,
  } = useAdminPlans();

  const {
    categories,
    filteredCategories,
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    submitting: categorySubmitting,
    refetch: refetchCategories,
  } = useCategories();

  const [feedback, setFeedback] = useState(null);

  // Plan modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [planModalError, setPlanModalError] = useState(null);

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryModalError, setCategoryModalError] = useState(null);

  const handleCreatePlanSubmit = async (data) => {
    setPlanModalError(null);
    try {
      if (planToEdit) {
        await updatePlan(planToEdit.id, data);
        setFeedback({
          type: "success",
          message: `Plan "${data.name}" updated successfully.`,
        });
      } else {
        await createPlan(data);
        setFeedback({
          type: "success",
          message: `Plan "${data.name}" created successfully.`,
        });
      }
      setIsPlanModalOpen(false);
      setPlanToEdit(null);
    } catch (err) {
      setPlanModalError(err.message || "Failed to save membership plan.");
    }
  };

  const handleCreateCategorySubmit = async (data) => {
    setCategoryModalError(null);
    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, data);
        setFeedback({
          type: "success",
          message: `Category "${data.name}" updated successfully.`,
        });
      } else {
        await createCategory(data);
        setFeedback({
          type: "success",
          message: `Category "${data.name}" created successfully.`,
        });
      }
      setIsCategoryModalOpen(false);
      setCategoryToEdit(null);
    } catch (err) {
      setCategoryModalError(err.message || "Failed to save workout category.");
    }
  };

  const handleTogglePlanStatus = async (plan) => {
    try {
      await togglePlanStatus(plan.id, !plan.is_active);
      setFeedback({
        type: "success",
        message: `Plan "${plan.name}" status updated.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update plan status.",
      });
    }
  };

  const handleToggleCategoryStatus = async (category) => {
    try {
      await toggleCategoryStatus(category.id, !category.is_active);
      setFeedback({
        type: "success",
        message: `Category "${category.name}" status updated.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update category status.",
      });
    }
  };

  const isLoading = plansLoading || categoriesLoading;
  const currentError = activeTab === "plans" ? plansError : categoriesError;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            Admin Operations
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Plan & Category Management
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure workout categories, membership pricing tiers, and active status toggles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "plans" ? (
            <button
              type="button"
              onClick={() => {
                setPlanModalError(null);
                setPlanToEdit(null);
                setIsPlanModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-accent text-brand-dark hover:bg-emerald-dark transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Create Membership Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCategoryModalError(null);
                setCategoryToEdit(null);
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-accent text-brand-dark hover:bg-emerald-dark transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Create Workout Category
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 rounded-xl text-xs flex items-center justify-between border bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-workspace-border flex gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "plans"
              ? "border-emerald-accent text-emerald-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Dumbbell className="w-4 h-4" /> Membership Plans ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "categories"
              ? "border-emerald-accent text-emerald-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Layers className="w-4 h-4" /> Plan Categories ({categories.length})
        </button>
      </div>

      {/* Error state with retry */}
      {currentError && !isLoading && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
          <span>{currentError}</span>
          <button
            type="button"
            onClick={() => (activeTab === "plans" ? refetchPlans() : refetchCategories())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-accent mb-3" />
          <p className="text-sm font-semibold">
            Loading membership plans...
          </p>
        </div>
      ) : activeTab === "plans" ? (
        <AdminPlanTable
          plans={filteredPlans}
          onEditPlan={(p) => {
            setPlanModalError(null);
            setPlanToEdit(p);
            setIsPlanModalOpen(true);
          }}
          onToggleStatus={(p) => handleTogglePlanStatus(p)}
        />
      ) : (
        <AdminCategoryTable
          categories={filteredCategories}
          onEditCategory={(c) => {
            setCategoryModalError(null);
            setCategoryToEdit(c);
            setIsCategoryModalOpen(true);
          }}
          onToggleStatus={(c) => handleToggleCategoryStatus(c)}
        />
      )}

      {/* Modals */}
      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setPlanToEdit(null);
          setPlanModalError(null);
        }}
        onSubmit={handleCreatePlanSubmit}
        planToEdit={planToEdit}
        categories={categories}
        submitting={planSubmitting}
        error={planModalError}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
          setCategoryModalError(null);
        }}
        onSubmit={handleCreateCategorySubmit}
        categoryToEdit={categoryToEdit}
        submitting={categorySubmitting}
        error={categoryModalError}
      />
    </div>
  );
}

export default AdminPlanManagement;
