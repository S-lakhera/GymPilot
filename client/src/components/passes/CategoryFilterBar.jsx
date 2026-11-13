import React from "react";

/**
 * Filter bar displaying category chips with pass counts.
 *
 * @param {{
 *   categories: Array<{ id: string|number, name: string, count: number }>,
 *   selectedCategory: string|number,
 *   onSelectCategory: (catId: string|number) => void,
 *   totalPassesCount: number
 * }} props
 */
export function CategoryFilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  totalPassesCount,
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <button
        type="button"
        onClick={() => onSelectCategory("all")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
          selectedCategory === "all"
            ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
            : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/50"
        }`}
      >
        <span>All Categories</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
            selectedCategory === "all"
              ? "bg-zinc-950/20 text-zinc-950"
              : "bg-zinc-700 text-zinc-400"
          }`}
        >
          {totalPassesCount}
        </span>
      </button>

      {categories.map((cat) => {
        const isSelected = String(selectedCategory) === String(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              isSelected
                ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
                : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/50"
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                isSelected
                  ? "bg-zinc-950/20 text-zinc-950"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}


