import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken as setAxiosAccessToken, setSessionExpiredCallback } from '../api/axiosClient.js';

export const AuthContext = createContext(null);

/**
 * Shared in-flight promise reference for silent session restoration.
 * Prevents duplicate refresh requests and token-rotation collisions when
 * React 18 StrictMode runs effects twice during development.
 */
let inFlightRestorePromise = null;

/**
 * Within-tab restoration caching variables to avoid duplicate network calls
 * across React 18 StrictMode double-mounting.
 */
let lastRestoreTime = 0;
let lastRestoreResult = null;

/**
 * Safely parses the JSON payload from a JWT token without verifying cryptographic signature.
 *
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if parsing fails
 */
function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Executes a task protected by a cross-tab web lock when supported by the browser engine.
 * Coordinates startup refresh so concurrent tabs opened simultaneously do not race to
 * submit the same unrotated refresh cookie and trigger token reuse alarms.
 *
 * @param {Function} fn - Async operation to execute exclusively
 * @returns {Promise<any>} Result of the async operation
 */
async function runWithRestoreLock(fn) {
  if (typeof navigator !== 'undefined' && navigator?.locks?.request) {
    return navigator.locks.request('gympilot_auth_restore_lock', fn);
  }
  return fn();
}

/**
 * Authentication Provider component.
 * Manages in-memory token storage, user identity, profile state, and the
 * startup silent session restoration lifecycle.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);
  const [restoreError, setRestoreError] = useState(null);

  /**
   * Syncs the access token in both React state and the Axios interceptor's in-memory store.
   *
   * @param {string|null} token - JWT access token or null
   */
  const updateAccessToken = useCallback((token) => {
    setAccessTokenState(token || null);
    setAxiosAccessToken(token || null);
  }, []);

  /**
   * Centralized session teardown handler invoked when the Axios interceptor catches a terminal 401.
   *
   * @param {string} [reasonMessage] - Descriptive reason for session expiration
   */
  const handleTerminalSessionExpired = useCallback((reasonMessage) => {
    updateAccessToken(null);
    setUser(null);
    setProfile(null);
    setIsProfileComplete(false);
    setRestoreError(null);
    setSessionExpiredMessage(reasonMessage || 'Your session has expired. Please log in again.');
  }, [updateAccessToken]);

  // Register session expired callback with Axios client once
  useEffect(() => {
    setSessionExpiredCallback(handleTerminalSessionExpired);
    return () => setSessionExpiredCallback(null);
  }, [handleTerminalSessionExpired]);

  /**
   * Silent Session Restoration on Mount / Page Refresh.
   * Leverages the HttpOnly refreshToken cookie to restore the session seamlessly.
   * Coordinates across browser tabs via Web Locks and shares in-flight promises across StrictMode mounts.
   */
  useEffect(() => {
    let isMounted = true;

    /**
     * Executes the silent session restoration flow.
     */
    async function restoreSession() {
      try {
        // Coordinate refresh across tabs and deduplicate within tab
        const refreshResult = await runWithRestoreLock(async () => {
          if (lastRestoreResult && Date.now() - lastRestoreTime < 2000) {
            return lastRestoreResult;
          }

          if (!inFlightRestorePromise) {
            inFlightRestorePromise = authApi.refreshToken({ isRestoreSession: true }).finally(() => {
              inFlightRestorePromise = null;
            });
          }

          const result = await inFlightRestorePromise;
          lastRestoreResult = result;
          lastRestoreTime = Date.now();
          return result;
        });

        if (refreshResult?.accessToken && isMounted) {
          updateAccessToken(refreshResult.accessToken);

          // Extract basic identity claims from access token payload so session is established immediately
          const tokenPayload = parseJwtPayload(refreshResult.accessToken);
          if (tokenPayload?.id && isMounted) {
            setUser({
              id: tokenPayload.id,
              email: tokenPayload.email,
              role: tokenPayload.role,
              firstName: tokenPayload.email ? tokenPayload.email.split('@')[0] : 'User',
              lastName: '',
            });
          }

          // Fetch user profile with the newly rotated access token
          try {
            const meResult = await authApi.getMe();
            if (isMounted) {
              setUser(meResult.user);
              setProfile(meResult.profile || null);
              setIsProfileComplete(Boolean(meResult.isProfileComplete));
              setRestoreError(null);
            }
          } catch (profileErr) {
            console.warn('Could not fetch enriched profile details during restore:', profileErr);
            if (isMounted) {
              // Preserve active token and retain recoverable state instead of treating as guest
              setRestoreError(profileErr);
            }
          }
        }
      } catch (err) {
        // Failure on startup is expected for unauthenticated visitors or expired cookies
        if (isMounted) {
          updateAccessToken(null);
          setUser(null);
          setProfile(null);
          setIsProfileComplete(false);
          setRestoreError(null);
        }
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [updateAccessToken]);

  /**
   * User Credential Login.
   * Sets user identity immediately upon login success, then attempts profile enrichment.
   *
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<Object>} Authenticated user object
   */
  const login = useCallback(
    async ({ email, password }) => {
      const loginResult = await authApi.login({ email, password });
      updateAccessToken(loginResult.accessToken);

      // Immediately establish session with credentials response
      setUser(loginResult.user);
      setSessionExpiredMessage(null);

      // Attempt to enrich with role-specific 1:1 profile details without blocking session establishment
      try {
        const meResult = await authApi.getMe();
        if (meResult?.user) setUser(meResult.user);
        setProfile(meResult?.profile || null);
        setIsProfileComplete(Boolean(meResult?.isProfileComplete));
      } catch (profileErr) {
        console.warn('Could not fetch enriched profile details on login:', profileErr);
      }

      return loginResult.user;
    },
    [updateAccessToken]
  );

  /**
   * Public Member Registration.
   * Sets user identity immediately upon registration success, then attempts profile enrichment.
   *
   * @param {Object} payload - Registration details
   * @returns {Promise<Object>} Registered user object
   */
  const register = useCallback(
    async (payload) => {
      const regResult = await authApi.register(payload);
      updateAccessToken(regResult.accessToken);

      // Immediately establish session with registration response
      setUser(regResult.user);
      setSessionExpiredMessage(null);

      // Attempt to enrich with role-specific 1:1 profile details without blocking session establishment
      try {
        const meResult = await authApi.getMe();
        if (meResult?.user) setUser(meResult.user);
        setProfile(meResult?.profile || null);
        setIsProfileComplete(Boolean(meResult?.isProfileComplete));
      } catch (profileErr) {
        console.warn('Could not fetch enriched profile details on registration:', profileErr);
      }

      return regResult.user;
    },
    [updateAccessToken]
  );

  /**
   * User Logout.
   * Clears in-memory credentials and triggers server-side session revocation.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore API errors during logout; client state must be purged regardless
    } finally {
      lastRestoreResult = null;
      lastRestoreTime = 0;
      updateAccessToken(null);
      setUser(null);
      setProfile(null);
      setIsProfileComplete(false);
      setRestoreError(null);
      setSessionExpiredMessage(null);
    }
  }, [updateAccessToken]);

  /**
   * Retries fetching user profile if startup enrichment encountered a network or server error.
   *
   * @returns {Promise<void>}
   */
  const retryRestoreProfile = useCallback(async () => {
    try {
      const meResult = await authApi.getMe();
      if (meResult?.user) setUser(meResult.user);
      setProfile(meResult?.profile || null);
      setIsProfileComplete(Boolean(meResult?.isProfileComplete));
      setRestoreError(null);
    } catch (err) {
      setRestoreError(err);
      throw err;
    }
  }, []);

  /**
   * Updates authenticated user identity in memory (e.g. after self-profile edit).
   *
   * @param {Object} updatedUser - Partial or complete user fields
   */
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  }, []);

  /**
   * Updates profile details in memory.
   *
   * @param {Object} updatedProfile - Updated profile fields
   * @param {boolean} [completeness] - Optional new profile completeness state
   */
  const updateProfile = useCallback((updatedProfile, completeness) => {
    setProfile(updatedProfile);
    if (typeof completeness === 'boolean') {
      setIsProfileComplete(completeness);
    }
  }, []);

  /**
   * Synchronizes updated user identity, profile details, and profile completeness in AuthContext.
   *
   * @param {{ user?: Object, profile?: Object|null, isProfileComplete?: boolean }} updates
   */
  const updateUserProfile = useCallback(
    ({ user: updatedUser, profile: updatedProfile, isProfileComplete: updatedCompleteness }) => {
      if (updatedUser) {
        setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
      }
      if (updatedProfile !== undefined) {
        setProfile(updatedProfile);
      }
      if (typeof updatedCompleteness === 'boolean') {
        setIsProfileComplete(updatedCompleteness);
      }
    },
    []
  );

  /**
   * Clears in-memory auth state, access token, and active user session locally
   * without calling the backend logout endpoint (e.g. following password change).
   */
  const clearLocalSession = useCallback(() => {
    updateAccessToken(null);
    setUser(null);
    setProfile(null);
    setIsProfileComplete(false);
    setRestoreError(null);
    setSessionExpiredMessage(null);
  }, [updateAccessToken]);

  /**
   * Clears the session expired notice after user dismisses it.
   */
  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isProfileComplete,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isRestoring,
      restoreError,
      role: user?.role || null,
      sessionExpiredMessage,
      login,
      register,
      logout,
      retryRestoreProfile,
      updateUser,
      updateProfile,
      updateUserProfile,
      clearLocalSession,
      clearSessionExpiredNotice,
    }),
    [
      user,
      profile,
      isProfileComplete,
      accessToken,
      isRestoring,
      restoreError,
      sessionExpiredMessage,
      login,
      register,
      logout,
      retryRestoreProfile,
      updateUser,
      updateProfile,
      updateUserProfile,
      clearLocalSession,
      clearSessionExpiredNotice,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
export { useAuth } from '../hooks/useAuth.js';
