import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { User, Mail, Shield, Phone, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Shared Profile Shell.
 * Renders user account information, profile completeness, and role badge.
 *
 * @returns {JSX.Element}
 */
export function ProfileShell() {
  const { user, isProfileComplete, role } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary">User Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account credentials and personal details.
        </p>
      </div>

      <div className="gym-card space-y-6">
        {/* User Identity Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-workspace-border">
          <div className="w-16 h-16 rounded-2xl bg-brand-dark text-emerald-accent flex items-center justify-center font-bold text-2xl shadow-md">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-pill bg-brand-dark text-text-inverted text-xs font-bold uppercase tracking-wider">
                {role}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-semibold ${
                  isProfileComplete
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-status-warning/15 text-status-warning'
                }`}
              >
                {isProfileComplete ? (
                  <>
                    <CheckCircle className="w-3 h-3" /> Profile Complete
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Profile Pending Details
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 rounded-xl bg-workspace border border-workspace-border">
            <span className="text-text-secondary text-xs flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-text-muted" /> Email Address
            </span>
            <span className="font-medium text-text-primary">{user?.email || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-workspace border border-workspace-border">
            <span className="text-text-secondary text-xs flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-text-muted" /> Phone Number
            </span>
            <span className="font-medium text-text-primary">{user?.phone || 'Not provided'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-workspace border border-workspace-border">
            <span className="text-text-secondary text-xs flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-text-muted" /> Account Role
            </span>
            <span className="font-medium text-text-primary capitalize">{role || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-workspace border border-workspace-border">
            <span className="text-text-secondary text-xs flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-text-muted" /> User Identifier
            </span>
            <span className="font-mono text-xs text-text-secondary">{user?.id || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileShell;
