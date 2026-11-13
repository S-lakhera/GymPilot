import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePasses } from "../../hooks/usePasses.js";
import { PassSummaryCounters } from "../../components/passes/PassSummaryCounters.jsx";
import { CategoryFilterBar } from "../../components/passes/CategoryFilterBar.jsx";
import { ActivePassCard } from "../../components/passes/ActivePassCard.jsx";
import { QueuedPassCard } from "../../components/passes/QueuedPassCard.jsx";
import { PastPassesTable } from "../../components/passes/PastPassesTable.jsx";
import { CancelPassConfirmModal } from "../../components/passes/CancelPassConfirmModal.jsx";
import { ROUTES } from "../../utils/constants.js";

/**
 * Member Passes Management Workspace.
 * Full lifecycle pass inspection, category filtering, and queued renewal governance.
 */
export function MemberPassesPage() {
  const {
    passes,
    filteredActive,
    filteredQueued,
    filteredPast,
    categories,
    selectedCategory,
    setSelectedCategory,
    counters,
    loading,
    cancelling,
    error,
    cancelPass,
    refetch,
  } = usePasses();

  const [activeTab, setActiveTab] = useState("active"); // "active" | "queued" | "history"
  const [passToCancel, setPassToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const handleConfirmCancel = async (passId) => {
    setCancelError(null);
    try {
      await cancelPass(passId);
      setFeedback({
        type: "success",
        message: "Queued pass successfully cancelled.",
      });
      setPassToCancel(null);
    } catch (err) {
      setCancelError(err.message || "Failed to cancel pass. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
            My Gym Passes & Memberships
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor active access privileges, review queued renewals, and track membership history.
          </p>
        </div>

        <Link
          to={ROUTES.PLANS}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
        >
          + Browse New Plans
        </Link>
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

      {/* Summary KPI Counters */}
      <PassSummaryCounters counters={counters} />

      {/* Category Filter & Navigation Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
        <CategoryFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalPassesCount={passes.length}
        />

        {/* Tab Controls */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Active Passes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "active" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {filteredActive.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queued")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "queued"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Queued</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "queued" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {filteredQueued.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Pass History</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "history" ? "bg-zinc-950/30 text-zinc-200" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {filteredPast.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          Loading your passes...
        </div>
      ) : (
        <div className="mt-4">
          {/* Active Passes View */}
          {activeTab === "active" && (
            <div>
              {filteredActive.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                    ✓
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200 font-heading">
                    No active pass found in this category
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                    You currently do not have an active membership pass. Explore our plans to start training today.
                  </p>
                  <Link
                    to={ROUTES.PLANS}
                    className="mt-5 inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors"
                  >
                    Explore Membership Plans
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredActive.map((pass) => (
                    <ActivePassCard key={pass.id} pass={pass} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Queued Renewals View */}
          {activeTab === "queued" && (
            <div>
              {filteredQueued.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                    ⏳
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200 font-heading">
                    No queued renewals scheduled
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                    When you renew a pass early while currently active in a category, it queues here to activate automatically without interruption.
                  </p>
                  <Link
                    to={ROUTES.PLANS}
                    className="mt-5 inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    View Plans to Renew
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQueued.map((pass) => (
                    <QueuedPassCard
                      key={pass.id}
                      pass={pass}
                      onRequestCancel={(p) => {
                        setCancelError(null);
                        setPassToCancel(p);
                      }}
                      cancelling={cancelling}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past History View */}
          {activeTab === "history" && (
            <div>
              <PastPassesTable passes={filteredPast} />
            </div>
          )}
        </div>
      )}

      {/* Queued Pass Cancellation Confirmation Modal */}
      <CancelPassConfirmModal
        pass={passToCancel}
        isOpen={Boolean(passToCancel)}
        onClose={() => {
          setPassToCancel(null);
          setCancelError(null);
        }}
        onConfirm={handleConfirmCancel}
        cancelling={cancelling}
        error={cancelError}
      />
    </div>
  );
}

