import React from 'react';
import { CalendarDays, Dumbbell, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Trainer Schedule Shell (Milestone 5.3 Route Probe).
 * Verifies role-based authorization restricting `/schedule` exclusively to TRAINER.
 *
 * @returns {JSX.Element}
 */
export function TrainerScheduleShell() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-1">
          <CalendarDays className="w-3.5 h-3.5" />
          Trainer Restricted Route
        </div>
        <h1 className="text-2xl font-bold font-display text-text-primary">Weekly Schedule</h1>
        <p className="text-xs text-text-secondary mt-1">
          Review upcoming training sessions and client bookings.
        </p>
      </div>

      <div className="gym-card space-y-4">
        <div className="p-8 text-center space-y-2 border border-dashed border-workspace-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-accent/10 text-emerald-accent flex items-center justify-center mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">Trainer Guard Verified</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Logged in as <strong className="text-emerald-dark">Coach {user?.firstName}</strong> ({user?.role}). Full schedule booking interface will be connected in Phase 6.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrainerScheduleShell;

