import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken as setAxiosAccessToken, setSessionExpiredCallback } from '../api/axiosClient.js';

export const AuthContext = createContext(null);

/**
 * Authentication Provider component.
 * Manages in-memory token storage, user identity, profile state, and the
 * startup silent session restoration lifecycle.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Helper to sync access token both in component state and the Axios interceptor memory
  const updateAccessToken = useCallback((token) => {
    setAccessTokenState(token || null);
    setAxiosAccessToken(token || null);
  }, []);

  // Handle centralized session teardown when Axios interceptor catches terminal 401
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
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // Step 1: Call refresh endpoint with HttpOnly cookie
        const refreshResult = await authApi.refreshToken();

        if (refreshResult?.accessToken && isMounted) {
          updateAccessToken(refreshResult.accessToken);

          // Step 2: Fetch user profile with the newly rotated access token
          const meResult = await authApi.getMe();
          if (isMounted) {
            setUser(meResult.user);
            setProfile(meResult.profile || null);
            setIsProfileComplete(Boolean(meResult.isProfileComplete));
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
   */
  const login = useCallback(
    async ({ email, password }) => {
      const loginResult = await authApi.login({ email, password });
      updateAccessToken(loginResult.accessToken);

      // Fetch complete profile with role-specific details
      const meResult = await authApi.getMe();
      setUser(meResult.user);
      setProfile(meResult.profile || null);
      setIsProfileComplete(Boolean(meResult.isProfileComplete));
      setSessionExpiredMessage(null);

      return meResult.user;
    },
    [updateAccessToken]
  );

  /**
   * Public Member Registration.
   */
  const register = useCallback(
    async (payload) => {
      const regResult = await authApi.register(payload);
      updateAccessToken(regResult.accessToken);

      // Fetch newly created profile
      const meResult = await authApi.getMe();
      setUser(meResult.user);
      setProfile(meResult.profile || null);
      setIsProfileComplete(Boolean(meResult.isProfileComplete));
      setSessionExpiredMessage(null);

      return meResult.user;
    },
    [updateAccessToken]
  );

  /**
   * User Logout.
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
   * Update authenticated user identity in memory (e.g. after self-profile edit).
   */
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  }, []);

  /**
   * Update profile details in memory.
   */
  const updateProfile = useCallback((updatedProfile, completeness) => {
    setProfile(updatedProfile);
    if (typeof completeness === 'boolean') {
      setIsProfileComplete(completeness);
    }
  }, []);

  /**
   * Clear session expired notice after it is displayed.
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
