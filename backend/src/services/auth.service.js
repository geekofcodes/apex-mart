import User from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Auth Service - Contains all authentication business logic
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password, role, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(
        "User with this email already exists",
        HTTP_STATUS.CONFLICT,
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "customer",
      phone,
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
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
      const jwt = (await import("jsonwebtoken")).default;
      const envConfig = (await import("../config/env.config.js")).default;
      decoded = jwt.verify(refreshToken, envConfig.jwt.refreshSecret);
    } catch (error) {
      throw new AppError(
        "Invalid or expired refresh token",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // Find user and verify stored refresh token
    const user = await User.findById(decoded._id).select("+refreshToken");
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();

    return { user, accessToken: newAccessToken };
  }

  /**
   * Logout user
   */
  async logout(userId) {
    // Remove refresh token from database
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { refreshToken: 1 } },
      { new: true },
    );

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    // Prevent updating sensitive fields
    const allowedFields = ["name", "phone", "avatar", "address"];
    const filteredData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(
        "Current password is incorrect",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save new refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
  }
}

export default new AuthService();
