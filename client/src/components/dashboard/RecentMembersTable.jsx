import React from "react";
import { formatDate } from "../../utils/formatters.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";

/**
 * Recent Members List for Administrators.
 *
 * @param {{
 *   members?: Array<Object>
 * }} props
 */
export function RecentMembersTable({ members = [] }) {
  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-display text-text-primary">
            Recent Member Registrations
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Latest member on-boarding activity
          </p>
        </div>
        <Link
          to={ROUTES.MEMBERS}
          className="text-xs font-semibold text-emerald-accent hover:text-emerald-dark inline-flex items-center gap-1 transition-colors"
        >
          Manage <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary border border-dashed border-workspace-border rounded-xl">
          <Users className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-text-primary">No Registered Members</p>
          <p className="text-xs mt-1">New registrations will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-workspace-border/60">
          {members.map((member) => (
            <div
              key={member.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 px-1 rounded-lg transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">
                  {member.full_name}
                </div>
                <div className="text-[11px] text-text-secondary truncate">
                  {member.email} {member.phone ? `• ${member.phone}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-text-muted hidden sm:inline-block">
                  {formatDate(member.created_at)}
                </span>
                <StatusBadge status={member.is_active} type="account" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentMembersTable;
