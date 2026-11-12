import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, ArrowRight, AlertCircle } from "lucide-react";
import { ROUTES } from "../../utils/constants.js";

const REQUIRED_FIELD_LABELS = {
  phone: "Phone Number",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Phone",
};

/**
 * Profile Completeness Banner for Members.
 * Displays progress and missing required field chips based directly
 * on the 5-field backend calculation (health conditions treated as optional).
 *
 * @param {{
 *   completeness?: {
 *     percentage: number,
 *     completedFields: number,
 *     totalFields: number,
 *     fields: Object
 *   }
 * }} props
 */
export function ProfileCompletenessBanner({ completeness }) {
  if (!completeness || completeness.percentage >= 100) {
    return null;
  }

  // Determine missing required fields (exclude optional healthConditions)
  const missingFields = Object.keys(REQUIRED_FIELD_LABELS).filter(
    (key) => completeness.fields && completeness.fields[key] === false
  );

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Profile Incomplete — {completeness.percentage}%
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Complete your profile for full facility & emergency clearance
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Providing emergency contacts and details ensures uninterrupted gym floor access.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>

          {/* Missing Fields Chips */}
          {missingFields.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-text-muted">Missing:</span>
              {missingFields.map((fieldKey) => (
                <span
                  key={fieldKey}
                  className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 text-[11px] font-medium"
                >
                  {REQUIRED_FIELD_LABELS[fieldKey]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <Link
            to={ROUTES.PROFILE}
            className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            Complete Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletenessBanner;
