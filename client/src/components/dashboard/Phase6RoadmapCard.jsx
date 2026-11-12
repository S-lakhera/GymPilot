import React from "react";
import { Users, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Phase 6 Roadmap and Feature Stubs Card for Trainer Dashboard.
 * Renders clear informational placeholders for upcoming modules without
 * presenting unbuilt features as completed.
 */
export function Phase6RoadmapCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Client Allocations Card */}
      <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-accent/10 text-emerald-accent flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Sparkles className="w-3 h-3 text-amber-500" /> Phase 6 Roadmap
            </span>
          </div>

          <h3 className="text-base font-bold font-display text-text-primary">
            Assigned Client Roster
          </h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Direct member-to-trainer allocation, customized workout regimens, and personal training tracking will be introduced in the Phase 6 Extended Modules.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-workspace-border/60 text-xs text-text-muted flex items-center justify-between">
          <span>0 Assigned Clients</span>
          <span className="font-semibold text-slate-400">Phase 6 Feature</span>
        </div>
      </div>

      {/* Daily Scheduled Sessions Card */}
      <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Sparkles className="w-3 h-3 text-amber-500" /> Phase 6 Roadmap
            </span>
          </div>

          <h3 className="text-base font-bold font-display text-text-primary">
            Coaching Schedule & Sessions
          </h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Attendance check-ins, group coaching slots, and calendar integrations will launch in Phase 6.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-workspace-border/60 flex items-center justify-between">
          <span className="text-xs text-text-muted">0 Scheduled Today</span>
          <Link
            to={ROUTES.SCHEDULE}
            className="text-xs font-semibold text-emerald-accent hover:text-emerald-dark inline-flex items-center gap-1"
          >
            Schedule Probe <span className="text-[10px] text-text-muted font-normal">(Preview)</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Phase6RoadmapCard;
