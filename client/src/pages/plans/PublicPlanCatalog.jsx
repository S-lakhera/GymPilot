import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Dumbbell, ShieldCheck, Flame, Loader2 } from "lucide-react";
import { ROUTES } from "../../utils/constants.js";
import { usePlans } from "../../hooks/usePlans.js";
import { CategoryFilterChips } from "../../components/plans/CategoryFilterChips.jsx";
import { PlanCatalogCard } from "../../components/plans/PlanCatalogCard.jsx";

/**
 * Public Plan Catalog Page for Unauthenticated Visitors.
 */
export function PublicPlanCatalog() {
  const navigate = useNavigate();
  const {
    categories,
    filteredPlans,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading,
    error,
  } = usePlans();

  const handleSelectPlan = (plan) => {
    // Redirect guest to registration with return intent
    navigate(ROUTES.REGISTER, { state: { from: ROUTES.PLANS, selectedPlanId: plan.id } });
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-accent text-xs font-bold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5" /> Transform Your Fitness
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-text-primary tracking-tight">
          Flexible Gym Memberships Designed For Your Goals
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Select from our multi-category training passes. Enjoy unlimited floor access, top-tier coaches, and zero hidden cancellation fees.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex justify-center">
        <CategoryFilterChips
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>

      {/* Plans Catalog Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-accent mb-3" />
          <p className="text-sm font-semibold">Loading membership plans...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center text-xs text-status-danger max-w-md mx-auto">
          {error.message || "Failed to load membership plans."}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center text-text-secondary border border-dashed border-workspace-border rounded-2xl max-w-md mx-auto">
          <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-text-primary">No Plans Available</p>
          <p className="text-xs mt-1">Check back soon for upcoming workout tiers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <PlanCatalogCard
              key={plan.id}
              plan={plan}
              isAuthenticated={false}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      )}

      {/* Trust Badges */}
      <div className="pt-8 border-t border-workspace-border/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs text-text-secondary">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-accent" /> No Hidden Joining Fees
        </div>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-accent" /> Multi-Category Independence
        </div>
        <div className="flex items-center justify-center gap-2">
          <Dumbbell className="w-4 h-4 text-emerald-accent" /> Certified Personal Induction
        </div>
      </div>
    </div>
  );
}

export default PublicPlanCatalog;

