import React, { useState } from "react";
import { Layers, Plus, Dumbbell, Shield, Loader2 } from "lucide-react";
import { usePlans } from "../../hooks/usePlans.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Admin Plans & Categories Workspace.
 * Dispatched under /plans for Administrators.
 */
export function AdminPlanManagement() {
  const [activeTab, setActiveTab] = useState("plans");
  const { plans, categories, isLoading, error } = usePlans();

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
            Configure workout categories, membership pricing tiers, and active
            status toggles.
          </p>
        </div>
      </div>

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

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-accent mb-3" />
          <p className="text-sm font-semibold">
            Loading plan management data...
          </p>
        </div>
      ) : activeTab === "plans" ? (
        <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              All Membership Plans
            </h3>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-workspace-border text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 pr-3">Plan Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 pl-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-workspace-border/50 text-text-primary">
                {plans.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-3 pr-3 font-bold">{p.name}</td>
                    <td className="py-3 px-3 text-text-secondary">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {p.category_name || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      {p.duration_days} Days
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-accent">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 pl-3 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          p.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              Workout Categories
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-workspace-border bg-workspace space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text-primary">
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-text-secondary">
                    {cat.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPlanManagement;
