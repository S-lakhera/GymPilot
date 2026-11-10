import React from "react";
import { Dumbbell } from "lucide-react";

/**
 * Branded Splash / Loading screen for initial application load and session restoration.
 */
export function SplashLoader({ message = "Loading GymPilot..." }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing Accent Glow */}
        <div className="absolute w-24 h-24 rounded-full bg-emerald-accent/20 animate-ping opacity-75" />
        <div className="relative w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-lg">
          <Dumbbell className="w-8 h-8 text-emerald-accent animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold font-display text-text-inverted tracking-tight mb-2">
          GYM<span className="text-emerald-accent">PILOT</span>
        </h1>
        <p className="text-text-muted text-sm font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

export default SplashLoader;
