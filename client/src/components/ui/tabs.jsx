import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn.js';

const TabsContext = createContext(null);

/**
 * Accessible Tabs root container.
 */
export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const currentTab = value !== undefined ? value : activeTab;

  const handleTabChange = (val) => {
    if (value === undefined) setActiveTab(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * Tabs List bar.
 */
export function TabsList({ className, children }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1.5 p-1 rounded-xl bg-brand-dark border border-brand-border',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Tabs Trigger button.
 */
export function TabsTrigger({ value, className, children, disabled = false }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      disabled={disabled}
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'bg-slate-800 text-emerald-accent shadow-sm font-semibold'
          : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/40',
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Tabs Content panel.
 */
export function TabsContent({ value, className, children }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn('mt-4 focus:outline-none animate-fade-in', className)}
    >
      {children}
    </div>
  );
}
