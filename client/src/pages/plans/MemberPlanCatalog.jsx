import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Dumbbell, Layers, Loader2 } from "lucide-react";
import { usePlans } from "../../hooks/usePlans.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";
import { CategoryFilterChips } from "../../components/plans/CategoryFilterChips.jsx";
import { PlanCatalogCard } from "../../components/plans/PlanCatalogCard.jsx";
import { CheckoutModal } from "../../components/checkout/CheckoutModal.jsx";

/**
 * Member Plan Catalog Page.
 * Category-aware membership browsing with in-place CheckoutModal.
 */
export function MemberPlanCatalog() {
  const {
    categories,
    filteredPlans,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading: plansLoading,
    error: plansError,
  } = usePlans();

  const [activePasses, setActivePasses] = useState([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  const fetchMemberPasses = useCallback(async () => {
    try {
      const res = await subscriptionApi.listSubscriptions();
      setActivePasses(res.subscriptions || []);
    } catch {
      // Non-blocking for catalog browsing
    }
  }, []);

  useEffect(() => {
    fetchMemberPasses();
  }, [fetchMemberPasses]);

  const handleCheckoutComplete = () => {
    // Refresh member passes to reflect new active or queued pass
    fetchMemberPasses();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            Membership Passes
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Plan Catalog & Renewals
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Browse available training tiers, add concurrent category passes, or renew your existing memberships.
          </p>
        </div>
      </div>

      {/* Active Passes Info Banner */}
      {activePasses.some((p) => p.status === "active") && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              You have{" "}
              <strong>
                {activePasses.filter((p) => p.status === "active").length} active pass(es)
              </strong>
              . Purchasing an additional pass in an active category will schedule your renewal seamlessly.
            </span>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <CategoryFilterChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Plans Catalog Grid */}
      {plansLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-accent mb-3" />
          <p className="text-sm font-semibold">Loading membership plans...</p>
        </div>
      ) : plansError ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center text-xs text-status-danger max-w-md mx-auto">
          {plansError.message || "Failed to load membership plans."}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center text-text-secondary border border-dashed border-workspace-border rounded-2xl max-w-md mx-auto">
          <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-text-primary">No Plans In This Category</p>
          <p className="text-xs mt-1">Select another category to view available options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <PlanCatalogCard
              key={plan.id}
              plan={plan}
              memberActivePasses={activePasses}
              isAuthenticated={true}
              role="member"
              onSelectPlan={(p) => setSelectedPlanForCheckout(p)}
            />
          ))}
        </div>
      )}

      {/* In-Place Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          isOpen={Boolean(selectedPlanForCheckout)}
          plan={selectedPlanForCheckout}
          memberActivePasses={activePasses}
          onClose={() => setSelectedPlanForCheckout(null)}
          onCheckoutComplete={handleCheckoutComplete}
        />
      )}
    </div>
  );
}

export default MemberPlanCatalog;

