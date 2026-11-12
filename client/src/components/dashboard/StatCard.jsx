import React from "react";
import { cn } from "../../utils/cn.js";

/**
 * Metric & KPI Stat Card.
 * Renders high-visibility metrics with contextual subtitles, trend or status pills,
 * and icon slots using GymPilot's Clean Workspace + Dark Athletic card styling.
 *
 * @param {{
 *   title: string,
 *   value: string|number,
 *   subtitle?: string,
 *   icon?: React.ElementType,
 *   badge?: React.ReactNode,
 *   className?: string
 * }} props
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  className,
}) {
  return (
    <div
      className={cn(
        "bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
        <span className="truncate">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-emerald-accent/10 text-emerald-accent flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          {value}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {subtitle && (
        <p className="text-xs text-text-secondary mt-1.5 line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;
