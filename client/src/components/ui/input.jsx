import React from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Accessible Dark Athletic Input primitive.
 * Supports slot slots for leading and trailing icons (e.g. password toggle).
 */
export const Input = React.forwardRef(
  (
    {
      className,
      type = 'text',
      hasError = false,
      startIcon: StartIcon,
      endSlot,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative flex items-center w-full">
        {StartIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
            <StartIcon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          aria-invalid={hasError ? 'true' : undefined}
          className={cn(
            'w-full rounded-lg bg-brand-dark/60 border text-text-primary placeholder:text-text-muted text-sm transition-colors duration-150',
            'focus:outline-none focus:ring-1',
            StartIcon ? 'pl-9' : 'pl-3.5',
            endSlot ? 'pr-10' : 'pr-3.5',
            'py-2.5',
            hasError
              ? 'border-status-danger focus:border-status-danger focus:ring-status-danger/40'
              : 'border-brand-border focus:border-emerald-accent focus:ring-emerald-accent/40',
            className
          )}
          {...props}
        />
        {endSlot && (
          <div className="absolute right-2.5 flex items-center">
            {endSlot}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
