import authService from "../services/auth.service.js";
import userService from "../services/user.service.js";
import ApiResponse from "../utils/apiResponse.js";
import UserDTO from "../dtos/user.dto.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * User Controller - Handles all user management requests
 */

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await authService.getProfile(userId);

  return ApiResponse.success(
    res,
    "Profile retrieved successfully",
    UserDTO.userResponse(user),
  );
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await authService.updateProfile(userId, req.body);

  return ApiResponse.success(
    res,
    "Profile updated successfully",
    UserDTO.userResponse(user),
  );
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(userId, currentPassword, newPassword);

  return ApiResponse.success(res, "Password changed successfully");
});

/**
 * Admin: Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);

  return ApiResponse.success(
    res,
    "Users retrieved successfully",
    UserDTO.userListResponse(result.users),
    200,
    result.pagination,
  );
});

/**
 * Admin: Get user stats
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  return ApiResponse.success(res, "User stats retrieved successfully", stats);
});

/**
 * Admin: Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(
    res,
    "User retrieved successfully",
    UserDTO.userResponse(user),
  );
});

/**
 * Admin: Update user
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return ApiResponse.success(
    res,
    "User updated successfully",
    UserDTO.userResponse(user),
  );
});

/**
 * Admin: Deactivate user
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  await userService.toggleUserActive(req.params.id, false);
  return ApiResponse.success(res, "User deactivated successfully");
});

/**
 * Admin: Activate user
 */
export const activateUser = asyncHandler(async (req, res) => {
  await userService.toggleUserActive(req.params.id, true);
  return ApiResponse.success(res, "User activated successfully");
});

/**
 * Admin: Delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  return ApiResponse.success(res, "User deleted successfully");
});
