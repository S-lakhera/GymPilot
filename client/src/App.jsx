import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dumbbell,
  Users,
  CreditCard,
  ShieldCheck,
  Activity,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "./utils/formatters.js";

export function App() {
  const [apiHealth, setApiHealth] = useState({
    status: "checking",
    data: null,
    error: null,
  });
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const response = await axios.get("/api/health");
      setApiHealth({ status: "healthy", data: response.data, error: null });
    } catch (err) {
      setApiHealth({
        status: "error",
        data: null,
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to connect to backend proxy",
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-workspace text-text-primary flex flex-col font-sans">
      {/* Brand Header */}
      <header className="bg-brand-dark border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-md">
              <Dumbbell className="w-5 h-5 text-emerald-accent" />
            </div>
            <div>
              <span className="text-xl font-bold font-display text-text-inverted tracking-tight">
                GYM<span className="text-emerald-accent">PILOT</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-pill bg-brand-surface text-text-muted border border-brand-border font-medium">
                Phase 5.1 Foundation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  apiHealth.status === "healthy"
                    ? "bg-status-success shadow-glow-emerald animate-pulse"
                    : apiHealth.status === "checking"
                      ? "bg-status-warning"
                      : "bg-status-danger"
                }`}
              />
              <span className="text-xs font-medium text-text-muted hidden md:inline-block">
                {apiHealth.status === "healthy"
                  ? "API Proxy Connected"
                  : apiHealth.status === "checking"
                    ? "Probing Proxy..."
                    : "Backend Offline"}
              </span>
            </div>

            <button
              onClick={checkHealth}
              disabled={checking}
              className="p-2 rounded-lg bg-brand-surface border border-brand-border text-text-muted hover:text-text-inverted transition-colors"
              title="Refresh API Health"
            >
              <RefreshCw
                className={`w-4 h-4 ${checking ? "animate-spin text-emerald-accent" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="bg-brand-dark text-text-inverted rounded-2xl p-6 sm:p-10 border border-brand-border shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-accent/10 border border-emerald-accent/30 text-emerald-accent text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Frontend Foundation Initialized
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              Modern Full-Stack Gym Management Architecture
            </h1>
            <p className="text-text-muted text-base sm:text-lg leading-relaxed">
              Vite + React with Dark Athletic branding, Tailored Tailwind
              tokens, and seamless Express reverse-proxy communication.
            </p>
          </div>

          {/* Decorative geometric accent */}
          <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-emerald-accent/5 blur-3xl pointer-events-none" />
        </section>

        {/* Milestone Status & API Health Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gym-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
                Proxy Connectivity
              </span>
              <Activity className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-2xl font-bold text-text-primary capitalize">
              {apiHealth.status === "healthy"
                ? "Express Online"
                : apiHealth.status}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Vite proxy maps{" "}
              <code className="px-1.5 py-0.5 rounded bg-workspace-hover text-text-primary font-mono text-[11px]">
                /api/*
              </code>{" "}
              to{" "}
              <code className="px-1.5 py-0.5 rounded bg-workspace-hover text-text-primary font-mono text-[11px]">
                localhost:5001
              </code>
              .
            </p>
          </div>

          <div className="gym-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
                Design System
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-2xl font-bold text-text-primary">
              Dark Athletic
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Slate dark surfaces (
              <code className="font-mono text-[11px]">#0F172A</code>), Emerald
              CTAs (<code className="font-mono text-[11px]">#34D399</code>),
              Light workspace cards (
              <code className="font-mono text-[11px]">#FFFFFF</code>).
            </p>
          </div>

          <div className="gym-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
                Currency & Date Utils
              </span>
              <CreditCard className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(2299)}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Standard IST date:{" "}
              <span className="font-medium text-text-primary">
                {formatDate(new Date())}
              </span>
              .
            </p>
          </div>
        </div>

        {/* Design System Tokens Showcase */}
        <section className="gym-card space-y-6">
          <div className="border-b border-workspace-border pb-4">
            <h2 className="text-xl font-bold text-text-primary">
              Visual Identity & Palette Tokens
            </h2>
            <p className="text-sm text-text-secondary">
              Verified color surfaces and component variants matching the agreed
              GymPilot aesthetic.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-brand-dark text-text-inverted border border-brand-border space-y-1">
              <div className="text-xs text-text-muted">Brand Dark</div>
              <div className="text-sm font-bold font-mono">#0F172A</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface text-text-inverted border border-brand-border space-y-1">
              <div className="text-xs text-text-muted">Brand Surface</div>
              <div className="text-sm font-bold font-mono">#1E293B</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-accent text-brand-dark font-bold space-y-1">
              <div className="text-xs opacity-80">Emerald Accent</div>
              <div className="text-sm font-mono">#34D399</div>
            </div>
            <div className="p-4 rounded-xl bg-lime-accent text-brand-dark font-bold space-y-1">
              <div className="text-xs opacity-80">Lime Accent</div>
              <div className="text-sm font-mono">#A3E635</div>
            </div>
          </div>

          {/* Interactive Component Preview */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button className="btn-primary gap-2">
              Primary Action <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-secondary">Secondary Button</button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-emerald-accent/15 text-emerald-dark text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Pass
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-pill bg-lime-accent/20 text-lime-dark text-xs font-bold uppercase tracking-wider">
              10% Discount
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-brand-border py-6 text-center text-xs text-text-muted">
        GymPilot &copy; 2026. Phase 5 Frontend Architecture.
      </footer>
    </div>
  );
}

export default App;
