import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

// Standard cookie options for refresh tokens
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
};

export const authController = {
  /**
   * Public Member Registration.
   */
  register: asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
    const result = await authService.register({ firstName, lastName, email, password, phone });

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', result.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponse.created(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Registration successful. Welcome to GymPilot!'
    );
  }),

  /**
   * User Login.
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', result.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Login successful'
    );
  }),

  /**
   * Refresh Access Token (with rotation).
   */
  refreshToken: asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken;
    const result = await authService.refreshToken(rawRefreshToken);

    // Set newly rotated refresh token cookie
    res.cookie('refreshToken', result.newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        accessToken: result.accessToken,
      },
      'Access token refreshed successfully'
    );
  }),

  /**
   * Logout.
   */
  logout: asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken;
    await authService.logout(rawRefreshToken);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    return ApiResponse.success(res, null, 'Logged out successfully');
  }),

  /**
   * Get Current Authenticated User & Profile.
   */
  getMe: asyncHandler(async (req, res) => {
    const result = await userService.getOwnProfile(req.user.id, req.user.role);
    return ApiResponse.success(res, result, 'User profile retrieved');
  }),

  /**
   * Change Password.
   */
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, { currentPassword, newPassword });

    // Invalidate cookie so user must log in again with new password
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      null,
      'Password changed successfully. All other sessions have been logged out. Please log in again.'
    );
  }),
};

export default authController;

