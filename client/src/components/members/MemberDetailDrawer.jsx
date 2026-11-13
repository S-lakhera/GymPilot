import React, { useEffect, useState, useRef } from "react";
import { formatDate, formatCurrency } from "../../utils/formatters.js";
import { subscriptionApi } from "../../api/subscriptionApi.js";

/**
 * Slide-over drawer component for comprehensive member inspection.
 *
 * @param {{
 *   member: Object|null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onRequestToggleStatus: (member: Object) => void,
 *   loading?: boolean,
 *   error?: string|null
 * }} props
 */
export function MemberDetailDrawer({
  member,
  isOpen,
  onClose,
  onRequestToggleStatus,
  loading = false,
  error = null,
}) {
  const [memberPasses, setMemberPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const previouslyFocusedElementRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement;

      // Focus first actionable element inside drawer
      const timer = setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('button[aria-label="Close drawer"]');
        closeBtn?.focus();
      }, 0);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "Tab" && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        if (
          previouslyFocusedElementRef.current &&
          typeof previouslyFocusedElementRef.current.focus === "function"
        ) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Fetch member passes whenever member changes and drawer is open
  useEffect(() => {
    let isMounted = true;
    if (isOpen && member?.id) {
      setLoadingPasses(true);
      subscriptionApi
        .listSubscriptions({ userId: member.id, limit: 10 })
        .then((res) => {
          if (isMounted) {
            setMemberPasses(res.subscriptions || []);
          }
        })
        .catch(() => {
          if (isMounted) setMemberPasses([]);
        })
        .finally(() => {
          if (isMounted) setLoadingPasses(false);
        });
    } else {
      setMemberPasses([]);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, member?.id]);

  if (!isOpen || !member) return null;

  const isActive = member.isActive ?? Boolean(member.is_active);
  const profile = member.profile || {};
  const dob = member.dateOfBirth || member.date_of_birth || profile.date_of_birth;
  const gender = member.gender || profile.gender;
  const emergencyName =
    member.emergencyContactName ||
    member.emergency_contact_name ||
    profile.emergency_contact_name;
  const emergencyPhone =
    member.emergencyContactPhone ||
    member.emergency_contact_phone ||
    profile.emergency_contact_phone;
  const health =
    member.healthConditions ||
    member.health_conditions ||
    profile.health_conditions;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/70 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col justify-between focus:outline-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Member Profile
                </span>
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
                  {isActive ? "Active Account" : "Deactivated"}
                </span>
              </div>
              <h2
                id="member-drawer-title"
                className="text-xl font-bold text-zinc-100 font-heading"
              >
                {member.firstName || member.first_name} {member.lastName || member.last_name}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ID #{member.id} • {member.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 text-lg leading-none"
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {loading && (
              <div className="text-center py-6 text-zinc-500">
                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                Updating details...
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Contact Details Card */}
            <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Contact & Account Details
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 block">Phone</span>
                  <span className="text-zinc-200 font-medium font-mono">
                    {member.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Registered On</span>
                  <span className="text-zinc-200 font-medium">
                    {formatDate(member.createdAt || member.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile & Health Information */}
            <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Personal & Medical Info
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 block">Date of Birth</span>
                  <span className="text-zinc-200 font-medium">
                    {dob ? formatDate(dob) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Gender</span>
                  <span className="text-zinc-200 font-medium capitalize">
                    {gender || "—"}
                  </span>
                </div>
                <div className="col-span-2 border-t border-zinc-800 pt-2">
                  <span className="text-zinc-500 block">Emergency Contact</span>
                  <span className="text-zinc-200 font-medium">
                    {emergencyName ? `${emergencyName} (${emergencyPhone || "No phone"})` : "Not provided"}
                  </span>
                </div>
                <div className="col-span-2 border-t border-zinc-800 pt-2">
                  <span className="text-zinc-500 block">Medical & Health Notes</span>
                  <span className="text-zinc-300 italic">
                    {health || "No health conditions reported."}
                  </span>
                </div>
              </div>
            </div>

            {/* Membership Passes History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Membership Passes ({memberPasses.length})
                </h3>
              </div>

              {loadingPasses ? (
                <div className="py-4 text-center text-zinc-500 text-xs">
                  Loading member passes...
                </div>
              ) : memberPasses.length === 0 ? (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-center text-zinc-500 text-xs">
                  No subscriptions or passes found for this member.
                </div>
              ) : (
                <div className="space-y-2">
                  {memberPasses.map((pass) => (
                    <div
                      key={pass.id}
                      className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-zinc-200">
                          {pass.plan_name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {formatDate(pass.start_date)} – {formatDate(pass.end_date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                            pass.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : pass.status === "queued"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {pass.status}
                        </span>
                        <div className="text-[11px] font-medium text-zinc-300 mt-0.5">
                          {formatCurrency(pass.price_paid ?? pass.final_amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => onRequestToggleStatus(member)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
              }`}
            >
              {isActive ? "Deactivate Account" : "Reactivate Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

