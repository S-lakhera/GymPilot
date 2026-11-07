import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { memberProfileRepository } from '../repositories/memberProfileRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { withTransaction } from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashToken, generateRandomString } from '../utils/crypto.js';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { UserRoles } from '../models/UserRoles.js';

export const authService = {
  /**
   * Public Member Registration flow.
   * Atomically creates user, member_profile, and refresh session inside a transaction.
   */
  async register({ firstName, lastName, email, password, phone }) {
    // 1. Verify email uniqueness
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists', null, 'EMAIL_EXISTS');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Atomic registration transaction
    return await withTransaction(async (conn) => {
      // Step A: Insert into users table (strictly assigned MEMBER role)
      const userId = await userRepository.create(
        {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: UserRoles.MEMBER,
          isActive: true,
        },
        conn
      );

      // Step B: Atomically create 1:1 member_profiles record
      await memberProfileRepository.create({ userId }, conn);

      // Step C: Generate Dual JWT tokens for immediate auto-login
      const userPayload = {
        id: userId,
        email: email.toLowerCase().trim(),
        role: UserRoles.MEMBER,
      };

      const accessToken = generateAccessToken(userPayload);
      const tokenId = generateRandomString(16);
      const rawRefreshToken = generateRefreshToken(userPayload, tokenId);
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await refreshTokenRepository.create({ userId, tokenHash, expiresAt }, conn);

      return {
        user: {
          id: userId,
          email: userPayload.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role: UserRoles.MEMBER,
        },
        accessToken,
        rawRefreshToken,
      };
    });
  },

  /**
   * User Login flow.
   * Authenticates credentials, checks account active status, and sets up refresh session.
   */
  async login({ email, password }) {
    // 1. Fetch user by email including password hash
    const user = await userRepository.findWithPasswordByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', null, 'INVALID_CREDENTIALS');
    }

    // 2. Check if account is active
    if (!user.is_active || user.deleted_at !== null) {
      throw new ForbiddenError(
        'Your account has been deactivated. Please contact gym administration.',
        null,
        'ACCOUNT_DEACTIVATED'
      );
    }

    // 3. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', null, 'INVALID_CREDENTIALS');
    }

    // 4. Issue Dual JWT tokens
    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const tokenId = generateRandomString(16);
    const rawRefreshToken = generateRefreshToken(userPayload, tokenId);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await refreshTokenRepository.create({ userId: user.id, tokenHash, expiresAt });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      rawRefreshToken,
    };
  },

  /**
   * Token Refresh flow with Rotation and Reuse Detection.
   */
  async refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required', null, 'NO_REFRESH_TOKEN');
    }

    // 1. Verify JWT signature and token type
    const decoded = verifyRefreshToken(rawRefreshToken);
    const tokenHash = hashToken(rawRefreshToken);

    // 2. Lookup session in database
    const session = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh session', null, 'SESSION_NOT_FOUND');
    }

    // 3. Reuse Detection: If an already-revoked token is presented, compromise is suspected
    if (session.revoked_at !== null) {
      // Invalidate all active sessions for this user
      await refreshTokenRepository.revokeAllForUser(decoded.id);
      throw new UnauthorizedError(
        'Security Alert: Revoked refresh token reused. All active sessions have been invalidated. Please log in again.',
        null,
        'TOKEN_REUSE_DETECTED'
      );
    }

    // 4. Check expiration
    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token has expired, please log in again', null, 'REFRESH_TOKEN_EXPIRED');
    }

    // 5. Ensure user account is still valid and active
    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account not found or deactivated', null, 'USER_INACTIVE');
    }

    // 6. Token Rotation: Revoke current token and issue new token pair
    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newTokenId = generateRandomString(16);
    const newRawRefreshToken = generateRefreshToken(userPayload, newTokenId);
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await withTransaction(async (conn) => {
      await refreshTokenRepository.revoke(tokenHash, newTokenHash, conn);
      await refreshTokenRepository.create(
        {
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
        },
        conn
      );
    });

    return {
      accessToken: newAccessToken,
      newRefreshToken: newRawRefreshToken,
    };
  },

  /**
   * Logout flow.
   * Revokes the current refresh session in MySQL.
   */
  async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      try {
        const tokenHash = hashToken(rawRefreshToken);
        await refreshTokenRepository.revoke(tokenHash);
      } catch (err) {
        // Silently ignore malformed tokens on logout
      }
    }
    return true;
  },

  /**
   * Change Password flow.
   * Validates current password, updates hash, and invalidates all existing sessions across devices.
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    // 1. Fetch user with password hash
    const user = await userRepository.findWithPasswordById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Validate current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect', null, 'INVALID_CURRENT_PASSWORD');
    }

    // 3. Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update password and revoke all active sessions in a single transaction
    await withTransaction(async (conn) => {
      await userRepository.updatePassword(userId, newPasswordHash, conn);
      await refreshTokenRepository.revokeAllForUser(userId, conn);
    });

    return true;
  },
};

export default authService;

