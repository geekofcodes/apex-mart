import userRepository from "../repositories/user.repository.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/auth.utils.js";
import envConfig from "../config/env.config.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Auth Service - Contains all authentication business logic
 * Uses PostgreSQL/Prisma via userRepository
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password, role, phone } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(
        "User with this email already exists",
        HTTP_STATUS.CONFLICT,
      );
    }

    // Hash password before saving
    const hashedPassword = await hashPassword(password);

    // Create user via repository
    const user = await userRepository.create({
      name,
      email,
      hashedPassword,
      role: role || "CUSTOMER",
      phone,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    await userRepository.updateRefreshToken(user.id, refreshToken);

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user and include password field
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate tokens
    // Make sure we strip password before sending user object back
    const { password: _, ...userWithoutPassword } = user;
    const accessToken = generateAccessToken(userWithoutPassword);
    const refreshToken = generateRefreshToken(userWithoutPassword);

    // Save refresh token to database
    await userRepository.updateRefreshToken(user.id, refreshToken);

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken, envConfig.jwtRefreshSecret);
    } catch (error) {
      throw new AppError(
        "Invalid or expired refresh token",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // Find user and verify stored refresh token
    const user = await userRepository.findById(decoded.id, false, true);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate new access token
    const { refreshToken: _, ...userWithoutToken } = user;
    const newAccessToken = generateAccessToken(userWithoutToken);

    return { user: userWithoutToken, accessToken: newAccessToken };
  }

  /**
   * Logout user
   */
  async logout(userId) {
    // Remove refresh token from database
    await userRepository.updateRefreshToken(userId, null);
    
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    // Allowed fields
    const { name, phone, avatar } = updateData;

    try {
      const user = await userRepository.updateProfile(userId, { name, phone, avatar });
      return user;
    } catch (error) {
      // Prisma error if user not found is handled in repo/middleware, 
      // but let's be explicit if we want to mimic old behavior
      if (error.code === 'P2025') {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user with password
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Current password is incorrect",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    // Generate new tokens
    const { password: _, ...userWithoutPassword } = user;
    const accessToken = generateAccessToken(userWithoutPassword);
    const refreshToken = generateRefreshToken(userWithoutPassword);

    // Save new refresh token
    await userRepository.updateRefreshToken(userId, refreshToken);

    return { user: userWithoutPassword, accessToken, refreshToken };
  }
}

export default new AuthService();
