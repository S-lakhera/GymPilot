import axios from 'axios';

/**
 * In-memory Access Token store.
 * The short-lived JWT access token is kept in-memory only (never in localStorage or sessionStorage)
 * to eliminate XSS token theft vectors.
 */
let inMemoryAccessToken = null;

/**
 * Sets or clears the active in-memory access token.
 *
 * @param {string|null} token - JWT access token or null to clear
 */
export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
}

/**
 * Retrieves the current in-memory access token.
 *
 * @returns {string|null} Active JWT access token or null
 */
export function getAccessToken() {
  return inMemoryAccessToken;
}

/**
 * Callback registered by AuthContext/Router to handle terminal session expiration.
 * When the refresh token is revoked or expired, this callback resets auth state and
 * navigates to /login?session_expired=true using React Router.
 */
let onSessionExpiredCallback = null;

/**
 * Registers the callback invoked when a terminal session expiration occurs.
 *
 * @param {Function|null} cb - Callback receiving the reason message
 */
export function setSessionExpiredCallback(cb) {
  onSessionExpiredCallback = typeof cb === 'function' ? cb : null;
}

/**
 * Single-flight refresh mutex queue.
 * When multiple concurrent protected API calls fail with 401 simultaneously,
 * only the FIRST request issues POST /api/auth/refresh.
 * All other 401 requests wait in `failedQueue` and replay automatically with the new token.
 */
let isRefreshing = false;
let failedQueue = [];

/**
 * Resolves or rejects all pending promises in the failed request queue.
 *
 * @param {Error|null} error - Error to reject queued requests with, or null on success
 * @param {string|null} [token=null] - New rotated access token to resolve queued requests with
 */
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Centralized Axios instance.
 * - baseURL: '/api' leverages Vite reverse proxy in development (and root proxy in production).
 * - withCredentials: true ensures HttpOnly cookies (refreshToken) are sent and received.
 */
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// REQUEST INTERCEPTOR: Inject Bearer Token
// =============================================================================
axiosClient.interceptors.request.use(
  (config) => {
    // If we have an in-memory access token, attach it to Authorization header
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// RESPONSE INTERCEPTOR: Catch 401 & Execute Single-Flight Mutex Refresh
// =============================================================================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: If there is no response (e.g. offline/network drop), forward error
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 1. Terminal 401 on the refresh endpoint itself
    // If the request that failed WAS /auth/refresh, the refresh session is dead (expired or revoked)
    if (originalRequest?.url?.includes('/auth/refresh')) {
      isRefreshing = false;

      // Clear in-memory token ONLY when status === 401; preserve token for transient 5xx or network errors
      if (status === 401) {
        inMemoryAccessToken = null;
      }

      processQueue(error, null);

      // Trigger centralized teardown (AuthContext reset + React Router redirect)
      // Only invoke callback if status is 401 AND this request is NOT marked as an anonymous startup probe
      if (status === 401 && !originalRequest?._isRestoreSession) {
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback(
            data?.message || 'Your session has expired. Please log in again.'
          );
        }
      }

      return Promise.reject(error);
    }

    // 2. 401 on a normal protected request (token expired or missing)
    if (status === 401 && !originalRequest._retry) {
      // Don't attempt refresh for public login/register attempts that return 401 invalid credentials
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      // If a refresh is already in-flight, enqueue this request until the new token arrives
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Issue silent refresh (browser automatically includes HttpOnly refreshToken cookie)
        const refreshResponse = await axiosClient.post('/auth/refresh');
        const newAccessToken = refreshResponse.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        // Store new access token in memory
        setAccessToken(newAccessToken);

        // Update default and original request headers
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Replay all queued requests with the rotated access token
        processQueue(null, newAccessToken);

        // Replay original request
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        // Any terminal 401 on /auth/refresh is already handled centrally by condition 1 above
        // (which sets inMemoryAccessToken = null, notifies onSessionExpiredCallback, and drains failedQueue).
        // Here we ensure any non-interceptor error also rejects queued requests cleanly.
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Forward all other HTTP errors
    return Promise.reject(error);
  }
);

export default axiosClient;
