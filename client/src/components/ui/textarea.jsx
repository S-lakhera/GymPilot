import React from "react";
import { cn } from "../../utils/cn.js";

/**
 * Accessible Dark Athletic Textarea primitive.
 */
export const Textarea = React.forwardRef(
  ({ className, hasError = false, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={hasError ? "true" : undefined}
        className={cn(
          "w-full rounded-lg bg-brand-dark/60 border text-text-primary placeholder:text-text-muted text-sm px-3.5 py-2.5 transition-colors duration-150",
          "focus:outline-none focus:ring-1",
          hasError
            ? "border-status-danger focus:border-status-danger focus:ring-status-danger/40"
            : "border-brand-border focus:border-emerald-accent focus:ring-emerald-accent/40",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
