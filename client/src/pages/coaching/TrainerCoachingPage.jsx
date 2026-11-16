import React, { useState } from 'react';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Activity,
  HeartPulse,
  ShieldCheck,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching.js';
import { formatDateIST } from '../../utils/formatters.js';

export function TrainerCoachingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const { data, isLoading, refresh } = useCoaching();

  const activeCount = Number(data?.metrics?.activeClients ?? data?.trainerProfile?.activeClientsCount ?? 0);
  const maxClients = Number(data?.metrics?.maxClients ?? data?.trainerProfile?.maxClients ?? 10);
  const capacityPct = data?.metrics?.capacityPercent ?? Math.min(Math.round((activeCount / maxClients) * 100), 100);
  const rawAssignments = data?.assignments || [];

  const assignments = rawAssignments.map((client) => {
    const subscriptions = client.active_subscriptions || client.activeSubscriptions || [];
    const activePassName = subscriptions.length > 0 ? subscriptions[0]?.plan_name : (client.activePassName || null);

    return {
      ...client,
      assignmentId: client.id || client.assignmentId,
      memberName: client.memberName || `${client.member_first_name || ''} ${client.member_last_name || ''}`.trim() || 'Gym Member',
      memberGender: client.member_gender || client.memberGender || 'male',
      memberEmail: client.memberEmail || client.member_email,
      memberPhone: client.memberPhone || client.member_phone,
      assignedAt: client.assignedAt || client.start_date || client.created_at,
      gracePeriodEndsAt: client.gracePeriodEndsAt || client.grace_period_ends_at,
      healthConditions: client.healthConditions || client.health_conditions,
      emergencyContactName: client.emergencyContactName || client.emergency_contact_name,
      emergencyContactPhone: client.emergencyContactPhone || client.emergency_contact_phone,
      activePassName,
      activeSubscriptions: subscriptions,
    };
  });

  // Filter clients locally for instant search feedback
  const filteredClients = assignments.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.memberEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.memberPhone?.includes(searchTerm);
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pausedCount = assignments.filter((a) => a.status === 'PAUSED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-inverted">
            My Coaching Roster
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track assigned members, health conditions, active passes, and coaching tenures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-brand-surface border border-brand-border text-text-muted hover:text-text-inverted hover:border-emerald-accent/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {/* Capacity & Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Capacity Utilization Card */}
        <div className="md:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center text-emerald-accent">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Client Capacity Load
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-text-inverted">
                    {activeCount}{' '}
                    <span className="text-sm font-normal text-text-muted">/ {maxClients}</span>
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      capacityPct >= 100
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : capacityPct >= 80
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {capacityPct}% Full
                  </span>
                </div>
              </div>
            </div>
            {trainerProfile.specialization && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-dark/50 border border-brand-border text-text-muted">
                {trainerProfile.specialization}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2.5 rounded-full bg-brand-dark overflow-hidden border border-brand-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPct >= 100
                    ? 'bg-rose-500'
                    : capacityPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-accent'
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-text-muted">
              <span>{maxClients - activeCount > 0 ? `${maxClients - activeCount} client slots available` : 'At maximum capacity'}</span>
              <span>Soft limit: {maxClients} athletes</span>
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center text-emerald-accent">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Active Athletes
              </p>
              <p className="text-2xl font-bold text-text-inverted mt-0.5">{activeCount}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Members actively training under your supervision.</p>
        </div>

        {/* Grace Period / Paused */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                10-Day Grace
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{pausedCount}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Pass expired; 10 days to renew before unassignment.</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search athlete by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-dark/50 border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-inverted placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-accent/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-dark/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-text-inverted focus:outline-none focus:border-emerald-accent/50 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused (Grace Period)</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Roster List */}
      {filteredClients.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-dark flex items-center justify-center mx-auto text-text-muted mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-text-inverted">
            {searchTerm || statusFilter ? 'No matching clients found' : 'No clients assigned yet'}
          </h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mt-1">
            {searchTerm || statusFilter
              ? 'Try modifying your search query or status filter.'
              : 'When members select you as their coach and their assignment is confirmed by the admin, their profile and training health cards will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const isPaused = client.status === 'PAUSED';
            const isActive = client.status === 'ACTIVE';

            return (
              <div
                key={client.assignmentId}
                className={`bg-brand-surface border rounded-xl p-5 shadow-sm transition-all hover:border-emerald-accent/30 flex flex-col justify-between ${
                  isPaused
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : isActive
                    ? 'border-brand-border'
                    : 'border-zinc-800 opacity-70'
                }`}
              >
                <div>
                  {/* Client Header & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-emerald-accent font-bold text-base">
                        {client.memberName?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-text-inverted">
                            {client.memberName}
                          </h4>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                              client.memberGender === 'female'
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            }`}
                          >
                            {client.memberGender === 'female' ? 'Female' : 'Male'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.memberEmail}
                          </span>
                          {client.memberPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.memberPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      {isPaused && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Paused (Grace)
                        </span>
                      )}
                      {client.status === 'TERMINATED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Terminated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grace Period Warning Banner */}
                  {isPaused && client.gracePeriodEndsAt && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-300">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Membership pass expired</p>
                        <p className="text-amber-200/80">
                          Grace period ends on{' '}
                          <span className="font-semibold">{formatDateIST(client.gracePeriodEndsAt)}</span>.
                          If no active pass is renewed by then, assignment will auto-terminate.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Passes & Health Condition Info */}
                  <div className="mt-4 pt-3 border-t border-brand-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-accent" />
                        Pass Status
                      </p>
                      <p className="text-text-inverted mt-0.5 font-medium">
                        {client.activePassName ? (
                          <span className="text-emerald-400">{client.activePassName}</span>
                        ) : (
                          <span className="text-rose-400">No active pass</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-accent" />
                        Coaching Since
                      </p>
                      <p className="text-text-inverted mt-0.5">
                        {formatDateIST(client.assignedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Medical Conditions / Health Goals */}
                  {client.healthConditions && (
                    <div className="mt-3 p-2.5 rounded-lg bg-brand-dark/40 border border-brand-border text-xs">
                      <p className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mb-1">
                        <HeartPulse className="w-3 h-3 text-rose-400" />
                        Health & Medical Advisory
                      </p>
                      <p className="text-text-muted leading-relaxed">
                        {client.healthConditions}
                      </p>
                    </div>
                  )}

                  {/* Assignment Notes */}
                  {client.notes && (
                    <div className="mt-2.5 p-2 rounded-lg bg-brand-dark/20 text-xs text-text-muted flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">"{client.notes}"</span>
                    </div>
                  )}
                </div>

                {/* Footer Details Button */}
                <div className="mt-4 pt-3 border-t border-brand-border/40 flex items-center justify-between text-xs text-text-muted">
                  <span>Assignment #{client.assignmentId}</span>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-emerald-accent hover:underline font-medium flex items-center gap-1"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-lg font-bold text-text-inverted">
                Athlete Profile: {selectedClient.memberName}
              </h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-text-muted hover:text-text-inverted text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-muted block">Email</span>
                  <span className="text-text-inverted font-medium">{selectedClient.memberEmail}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Phone</span>
                  <span className="text-text-inverted font-medium">{selectedClient.memberPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Gender</span>
                  <span className="text-text-inverted font-medium capitalize">{selectedClient.memberGender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Status</span>
                  <span className="font-semibold text-emerald-400">{selectedClient.status}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Assigned On</span>
                  <span className="text-text-inverted font-medium">{formatDateIST(selectedClient.assignedAt)}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Emergency Contact</span>
                  <span className="text-text-inverted font-medium">
                    {selectedClient.emergencyContactName ? `${selectedClient.emergencyContactName} (${selectedClient.emergencyContactPhone || 'No phone'})` : 'None'}
                  </span>
                </div>
              </div>

              {selectedClient.healthConditions && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <h5 className="font-semibold text-rose-300 text-xs mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5" /> Medical Conditions & Pre-existing Injuries
                  </h5>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {selectedClient.healthConditions}
                  </p>
                </div>
              )}

              {selectedClient.notes && (
                <div className="p-3 rounded-lg bg-brand-dark/50 border border-brand-border">
                  <span className="text-xs text-text-muted block mb-1">Coaching / Onboarding Notes:</span>
                  <p className="text-xs text-text-inverted">{selectedClient.notes}</p>
                </div>
              )}

              {selectedClient.status === 'PAUSED' && selectedClient.gracePeriodEndsAt && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-bold block mb-0.5">Grace Period Expiry:</span>
                  {formatDateIST(selectedClient.gracePeriodEndsAt)}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-brand-border flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-lg bg-brand-dark border border-brand-border text-sm text-text-inverted hover:border-emerald-accent/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerCoachingPage;

