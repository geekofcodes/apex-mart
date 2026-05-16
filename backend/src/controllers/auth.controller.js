import authService from "../services/auth.service.js";
import ApiResponse from "../utils/apiResponse.js";
import AuthDTO from "../dtos/auth.dto.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Auth Controller - Handles all authentication requests
 */

/**
 * Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
  );

  // Set refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(
    res,
    "User registered successfully",
    AuthDTO.authResponse(user, accessToken),
    HTTP_STATUS.CREATED,
  );
});

/**
 * Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
  );

  // Set refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(
    res,
    "Logged in successfully",
    AuthDTO.authResponse(user, accessToken),
  );
});

/**
 * Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const { user, accessToken } =
    await authService.refreshAccessToken(refreshToken);

  return ApiResponse.success(
    res,
    "Access token refreshed",
    AuthDTO.authResponse(user, accessToken),
  );
});

/**
 * Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await authService.logout(userId);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  return ApiResponse.success(res, "Logged out successfully");
});
