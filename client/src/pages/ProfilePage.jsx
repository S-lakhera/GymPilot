import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { MemberProfileForm } from './profile/MemberProfileForm.jsx';
import { TrainerProfileForm } from './profile/TrainerProfileForm.jsx';
import { AdminProfileForm } from './profile/AdminProfileForm.jsx';
import { ChangePasswordForm } from './profile/ChangePasswordForm.jsx';

/**
 * Profile Workspace Page.
 * Renders the user identity header, profile completeness badge,
 * and tabbed navigation between role-specific Profile Details and Security & Password.
 *
 * @returns {JSX.Element}
 */
export function ProfilePage() {
  const { user, isProfileComplete, role, restoreError, retryRestoreProfile } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryRestoreProfile();
    } catch {
      // Handled via restoreError in AuthContext
    } finally {
      setRetrying(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your personal information, role-specific attributes, and security credentials.
        </p>
      </div>

      {/* Recoverable Network / Profile Error Notice */}
      {restoreError && (
        <div className="p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm flex items-center justify-between gap-3 animate-slide-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              Could not load complete profile details due to a network or server issue. Basic session active.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="text-xs font-semibold underline hover:no-underline flex-shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Identity Summary Card */}
      <div className="gym-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark text-emerald-accent flex items-center justify-center font-bold text-2xl shadow-md border border-brand-border flex-shrink-0">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-display">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-dark text-text-inverted text-xs font-bold uppercase tracking-wider border border-brand-border">
                  {role}
                </span>

                {/* Profile Completeness Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isProfileComplete
                      ? 'bg-status-success/15 text-status-success'
                      : 'bg-status-warning/15 text-status-warning'
                  }`}
                >
                  {isProfileComplete ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Profile Complete
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Profile Incomplete
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Account Metadata Details */}
          <div className="flex flex-col sm:items-end gap-1 text-xs text-text-secondary border-t sm:border-t-0 pt-3 sm:pt-0 border-workspace-border">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-text-muted" />
              <span className="font-medium text-text-primary">{user?.email || '—'}</span>
            </div>
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>Member since {formattedDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Profile Workspace */}
      <Tabs defaultValue="details">
        <TabsList className="mb-2">
          <TabsTrigger value="details">Profile Details</TabsTrigger>
          <TabsTrigger value="security">Security & Password</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {role === 'member' && <MemberProfileForm />}
          {role === 'trainer' && <TrainerProfileForm />}
          {role === 'admin' && <AdminProfileForm />}
          {!role && (
            <div className="gym-card p-6 text-center text-xs text-text-muted">
              Loading role information...
            </div>
          )}
        </TabsContent>

        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfilePage;
