import React, { createContext, useContext, useState, useId } from "react";
import { cn } from "../../utils/cn.js";

const TabsContext = createContext(null);

/**
 * Accessible Tabs root container.
 */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState(defaultValue);
  const currentTab = value !== undefined ? value : activeTab;

  const handleTabChange = (val) => {
    if (value === undefined) setActiveTab(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider
      value={{ baseId, activeTab: currentTab, setActiveTab: handleTabChange }}
    >
      <div className={cn("w-full", className)}>{children}</div>
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
        "inline-flex items-center gap-1.5 p-1 rounded-xl bg-brand-dark border border-brand-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Tabs Trigger button with roving focus and arrow-key navigation.
 */
export function TabsTrigger({ value, className, children, disabled = false }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.activeTab === value;
  const triggerId = `${context.baseId}-tab-${value}`;
  const panelId = `${context.baseId}-panel-${value}`;

  const handleKeyDown = (e) => {
    if (
      e.key !== "ArrowRight" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowDown" &&
      e.key !== "ArrowUp"
    ) {
      return;
    }

    const tabList = e.currentTarget.closest('[role="tablist"]');
    if (!tabList) return;

    const tabs = Array.from(
      tabList.querySelectorAll('button[role="tab"]:not([disabled])'),
    );
    const currentIndex = tabs.indexOf(e.currentTarget);
    if (currentIndex === -1) return;

    e.preventDefault();
    let targetIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      targetIndex = (currentIndex + 1) % tabs.length;
    } else {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    tabs[targetIndex]?.focus();
    tabs[targetIndex]?.click();
  };

  return (
    <button
      id={triggerId}
      role="tab"
      type="button"
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      aria-controls={isActive ? panelId : undefined}
      onClick={() => context.setActiveTab(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50",
        isActive
          ? "bg-slate-800 text-emerald-accent shadow-sm font-semibold"
          : "text-text-secondary hover:text-text-primary hover:bg-slate-800/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Tabs Content panel.
 */
export function TabsContent({
  value,
  className,
  forceMount = false,
  children,
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  const isActive = context.activeTab === value;
  if (!isActive && !forceMount) return null;

  const triggerId = `${context.baseId}-tab-${value}`;
  const panelId = `${context.baseId}-panel-${value}`;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      tabIndex={0}
      hidden={!isActive}
      className={cn(
        "mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50 focus-visible:rounded-xl animate-fade-in",
        !isActive && "hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
