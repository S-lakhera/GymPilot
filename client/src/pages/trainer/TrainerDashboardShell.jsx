import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Dumbbell, Users, CalendarDays, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants.js';

/**
 * Trainer Dashboard Shell.
 * Renders trainer workspace status, scheduled sessions, and assigned clients.
 *
 * @returns {JSX.Element}
 */
export function TrainerDashboardShell() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="gym-dark-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            Trainer Coaching Workspace
          </div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            Hello, Coach {user?.firstName || 'Trainer'}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Track your client training sessions and weekly schedules.
          </p>
        </div>

        <Link
          to={ROUTES.SCHEDULE}
          className="btn-primary text-xs py-2 px-4 self-start sm:self-auto"
        >
          View Schedule <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Metrics Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Assigned Clients</span>
            <Users className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Active Roster</div>
          <p className="text-xs text-text-secondary">Connected to /api/dashboard/trainer</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Sessions Today</span>
            <CalendarDays className="w-4 h-4 text-emerald-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">Scheduled</div>
          <p className="text-xs text-text-secondary">Calendar integration</p>
        </div>

        <div className="gym-card space-y-2">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Status</span>
            <ClipboardCheck className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-status-success">On Duty</div>
          <p className="text-xs text-text-secondary">Role: {user?.role}</p>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboardShell;
