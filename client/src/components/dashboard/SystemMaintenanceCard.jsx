import React, { useState } from "react";
import { RefreshCw, CheckCircle, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { dashboardApi } from "../../api/dashboardApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDateTime } from "../../utils/formatters.js";

/**
 * System Maintenance Card for Administrators.
 * Exposes an on-demand, idempotent batch maintenance trigger to reconcile
 * subscription statuses across the database without hidden background calls.
 *
 * @param {{
 *   onSyncSuccess?: () => void
 * }} props
 */
export function SystemMaintenanceCard({ onSyncSuccess }) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const handleSyncExecute = async () => {
    setIsSyncing(true);
    setShowConfirm(false);

    try {
      const res = await dashboardApi.syncSubscriptionStatuses();
      setLastSyncResult(res);

      toast.success(
        `Status sync complete: ${res.expiredSubscriptions} expired, ${res.activatedQueuedSubscriptions} queued passes promoted, ${res.purgedStaleSubscriptions} checkouts purged.`
      );

      if (onSyncSuccess) {
        onSyncSuccess();
      }
    } catch (err) {
      toast.error(err.message || "Failed to execute subscription status sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
            <RefreshCw className="w-3 h-3 text-emerald-accent" />
            Operations & Lifecycle
          </div>
          <h3 className="text-base font-bold font-display text-text-primary">
            Subscription Status Synchronization
          </h3>
          <p className="text-xs text-text-secondary max-w-xl">
            Passes automatically self-heal via calendar-date bounds. Run this on-demand batch sync to reconcile database records (expire outdated passes, activate queued renewals, and purge stale checkouts).
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => setShowConfirm(true)}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Run Status Sync
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm"
        >
          <div className="bg-workspace-card border border-workspace-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">
                  Confirm Subscription Sync
                </h4>
                <p className="text-xs text-text-secondary">
                  Batch administrative lifecycle maintenance
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              This will evaluate all memberships against today's date:
              <br />• Expire active subscriptions whose end date has passed.
              <br />• Promote queued renewals whose start date has arrived (if no active plan exists in that category).
              <br />• Purge pending checkouts older than 24 hours.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-workspace-border">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncExecute}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Confirm & Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Sync Result Badge */}
      {lastSyncResult && (
        <div className="mt-4 pt-3 border-t border-workspace-border/60 flex flex-wrap items-center justify-between text-xs text-text-secondary gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
            <span>
              Last sync: <strong className="text-text-primary">{lastSyncResult.expiredSubscriptions}</strong> expired,{" "}
              <strong className="text-text-primary">{lastSyncResult.activatedQueuedSubscriptions}</strong> promoted,{" "}
              <strong className="text-text-primary">{lastSyncResult.purgedStaleSubscriptions}</strong> purged.
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            {formatDateTime(lastSyncResult.syncedAt)}
          </span>
        </div>
      )}
    </div>
  );
}

export default SystemMaintenanceCard;
