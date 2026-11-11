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
   * Shares the in-flight promise across StrictMode effect executions to prevent token reuse collisions.
   */
  useEffect(() => {
    let isMounted = true;

    /**
     * Executes the silent session restoration flow.
     */
    async function restoreSession() {
      try {
        // Share in-flight refresh promise across concurrent effect mounts
        if (!inFlightRestorePromise) {
          inFlightRestorePromise = authApi.refreshToken({ isRestoreSession: true }).finally(() => {
            inFlightRestorePromise = null;
          });
        }

        const refreshResult = await inFlightRestorePromise;

        if (refreshResult?.accessToken && isMounted) {
          updateAccessToken(refreshResult.accessToken);

          // Fetch user profile with the newly rotated access token
          try {
            const meResult = await authApi.getMe();
            if (isMounted) {
              setUser(meResult.user);
              setProfile(meResult.profile || null);
              setIsProfileComplete(Boolean(meResult.isProfileComplete));
            }
          } catch (profileErr) {
            console.warn('Could not fetch enriched profile details during restore:', profileErr);
          }
        }
      } catch (err) {
        // Failure on startup is expected for unauthenticated visitors or expired cookies
        if (isMounted) {
          updateAccessToken(null);
          setUser(null);
          setProfile(null);
          setIsProfileComplete(false);
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
      updateAccessToken(null);
      setUser(null);
      setProfile(null);
      setIsProfileComplete(false);
      setSessionExpiredMessage(null);
    }
  }, [updateAccessToken]);

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
      role: user?.role || null,
      sessionExpiredMessage,
      login,
      register,
      logout,
      updateUser,
      updateProfile,
      clearSessionExpiredNotice,
    }),
    [
      user,
      profile,
      isProfileComplete,
      accessToken,
      isRestoring,
      sessionExpiredMessage,
      login,
      register,
      logout,
      updateUser,
      updateProfile,
      clearSessionExpiredNotice,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
export { useAuth } from '../hooks/useAuth.js';
