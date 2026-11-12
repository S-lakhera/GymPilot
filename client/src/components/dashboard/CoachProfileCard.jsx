import React from "react";
import { Award, Briefcase, Mail, Phone, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Coach Profile Credentials Card for Trainers.
 *
 * @param {{
 *   profile?: {
 *     user_id: number,
 *     full_name: string,
 *     email: string,
 *     phone: string,
 *     is_active: number|boolean,
 *     specialization: string,
 *     experience_years: number,
 *     certification: string,
 *     bio: string,
 *     monthly_salary?: string|number
 *   }
 * }} props
 */
export function CoachProfileCard({ profile }) {
  if (!profile) return null;

  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-workspace-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={profile.is_active} type="account" />
            {profile.specialization && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {profile.specialization}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold font-display text-text-primary">
            {profile.full_name}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mt-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {profile.email}
            </span>
            {profile.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {profile.phone}
              </span>
            )}
          </div>
        </div>

        <Link
          to={ROUTES.PROFILE}
          className="btn-secondary text-xs py-2 px-3.5 self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">
            <Briefcase className="w-3.5 h-3.5 text-emerald-accent" />
            Experience
          </div>
          <div className="text-lg font-bold text-text-primary">
            {profile.experience_years ? `${profile.experience_years} Years` : "—"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-accent" />
            Certifications
          </div>
          <div className="text-sm font-medium text-text-primary truncate">
            {profile.certification || "No certifications listed"}
          </div>
        </div>
      </div>

      {profile.bio && (
        <div className="text-xs text-text-secondary leading-relaxed pt-1">
          <strong className="text-text-primary">Bio: </strong>
          {profile.bio}
        </div>
      )}

      {profile.monthly_salary && (
        <div className="text-xs text-text-muted pt-2 border-t border-workspace-border/40 flex items-center justify-between">
          <span>Contract Salary (Admin viewable)</span>
          <span className="font-semibold text-text-primary">
            {formatCurrency(profile.monthly_salary)} / month
          </span>
        </div>
      )}
    </div>
  );
}

export default CoachProfileCard;
