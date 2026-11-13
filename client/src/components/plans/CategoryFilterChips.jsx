import React from "react";
import { Layers } from "lucide-react";

/**
 * Workout Category Filter Chips Bar.
 *
 * @param {{
 *   categories: Array<Object>,
 *   selectedCategoryId: string|number,
 *   onSelectCategory: (id: string|number) => void
 * }} props
 */
export function CategoryFilterChips({
  categories = [],
  selectedCategoryId = "all",
  onSelectCategory,
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelectCategory("all")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
          selectedCategoryId === "all"
            ? "bg-brand-dark text-text-inverted shadow-sm"
            : "bg-workspace-card text-text-secondary border border-workspace-border hover:bg-slate-50"
        }`}
      >
        <Layers className="w-3.5 h-3.5" /> All Categories
      </button>

      {categories.map((cat) => {
        const isSelected = String(selectedCategoryId) === String(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-emerald-accent text-slate-900 font-bold shadow-sm"
                : "bg-workspace-card text-text-secondary border border-workspace-border hover:bg-slate-50"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilterChips;

