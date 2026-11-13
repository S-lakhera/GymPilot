import React, { useState } from "react";
import { useMembers } from "../../hooks/useMembers.js";
import { MemberSearchFilterBar } from "../../components/members/MemberSearchFilterBar.jsx";
import { MemberTable } from "../../components/members/MemberTable.jsx";
import { MemberDetailDrawer } from "../../components/members/MemberDetailDrawer.jsx";
import { MemberStatusToggleModal } from "../../components/members/MemberStatusToggleModal.jsx";

/**
 * Admin Member Management Page.
 * Searchable, filterable member directory with slide-over inspection drawer and account lifecycle controls.
 */
export function MembersManagementPage() {
  const {
    members,
    pagination,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    selectedMember,
    drawerLoading,
    drawerError,
    openDrawer,
    closeDrawer,
    togglingStatusId,
    setMemberStatus,
    refetch,
  } = useMembers({ initialLimit: 10 });

  const [statusTarget, setStatusTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleConfirmToggle = async (id, nextState) => {
    try {
      const result = await setMemberStatus(id, nextState);
      setFeedback({
        type: "success",
        message: result.message || `Member account successfully ${nextState ? "reactivated" : "deactivated"}.`,
      });
      setStatusTarget(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update member status. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
            Member Directory & Accounts
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            View all registered gym members, inspect pass histories, and manage account statuses.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75 text-sm font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Status Filters */}
      <MemberSearchFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalRecords={pagination.totalRecords}
      />

      {/* Members Table */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          Loading member directory...
        </div>
      ) : (
        <div className="space-y-4">
          <MemberTable
            members={members}
            onViewMember={(m) => openDrawer(m)}
            onRequestToggleStatus={(m) => setStatusTarget(m)}
            togglingId={togglingStatusId}
          />

          {/* Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
              <div>
                Showing page <span className="font-semibold text-zinc-200">{pagination.page}</span> of{" "}
                <span className="font-semibold text-zinc-200">{pagination.totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev && page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext && page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Inspection Drawer */}
      <MemberDetailDrawer
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={closeDrawer}
        onRequestToggleStatus={(m) => {
          setStatusTarget(m);
        }}
        loading={drawerLoading}
        error={drawerError}
      />

      {/* Status Toggle Confirmation Modal */}
      <MemberStatusToggleModal
        member={statusTarget}
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmToggle}
        toggling={Boolean(togglingStatusId)}
      />
    </div>
  );
}
