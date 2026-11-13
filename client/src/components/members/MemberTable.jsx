import React from "react";
import { formatDate } from "../../utils/formatters.js";

/**
 * Admin members data table with status indicators and action controls.
 *
 * @param {{
 *   members: Array<Object>,
 *   onViewMember: (member: Object) => void,
 *   onRequestToggleStatus: (member: Object) => void,
 *   togglingId?: number|null
 * }} props
 */
export function MemberTable({
  members,
  onViewMember,
  onRequestToggleStatus,
  togglingId = null,
}) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">No member accounts match the current filter or search criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px] border-b border-zinc-800">
          <tr>
            <th className="py-3.5 px-4">Member</th>
            <th className="py-3.5 px-4">Phone</th>
            <th className="py-3.5 px-4">Account Status</th>
            <th className="py-3.5 px-4">Emergency Contact</th>
            <th className="py-3.5 px-4">Joined</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {members.map((member) => {
            const isActive = Boolean(member.is_active);
            const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase() || "M";
            const isToggling = togglingId === member.id;

            return (
              <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-zinc-300 font-mono">
                  {member.phone || "—"}
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        isActive ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    {isActive ? "Active" : "Deactivated"}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-zinc-400">
                  {member.emergency_contact_name ? (
                    <div>
                      <span className="text-zinc-200 font-medium">
                        {member.emergency_contact_name}
                      </span>
                      {member.emergency_contact_phone && (
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {member.emergency_contact_phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-600 italic">Not provided</span>
                  )}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400">
                  {formatDate(member.created_at)}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    onClick={() => onViewMember(member)}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => onRequestToggleStatus(member)}
                    disabled={isToggling}
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    } disabled:opacity-50`}
                  >
                    {isToggling ? "Updating..." : isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
