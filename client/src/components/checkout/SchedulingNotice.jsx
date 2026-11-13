import React from "react";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Scheduling Notice Banner indicating whether the pass activates today or queues behind an active pass.
 *
 * @param {{
 *   schedulingInfo: {
 *     willQueue: boolean,
 *     isBlocked: boolean,
 *     reason?: string,
 *     message?: string
 *   }
 * }} props
 */
export function SchedulingNotice({ schedulingInfo }) {
  if (!schedulingInfo) return null;

  if (schedulingInfo.isBlocked) {
    return (
      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Queue Limit Reached:</span>{" "}
          {schedulingInfo.reason ||
            "A renewal is already scheduled in this category."}
        </div>
      </div>
    );
  }

  if (schedulingInfo.willQueue) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Queued Renewal:</span>{" "}
          {schedulingInfo.message ||
            "This pass will be queued to start when your current active pass expires."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
      <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
      <div>
        <span className="font-bold">Immediate Activation:</span> This pass will
        be activated immediately upon payment completion.
      </div>
    </div>
  );
}

export default SchedulingNotice;
