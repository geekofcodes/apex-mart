import userRepository from "../repositories/user.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * User Service - Contains all user management business logic
 */
class UserService {
  /**
   * Get all users (Admin)
   */
  async getAllUsers(query = {}) {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const { users, total } = await userRepository.findMany({
      role,
      search,
      skip,
      limit: Number(limit),
    });

    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  /**
   * Update user (Admin)
   */
  async updateUser(userId, updateData) {
    try {
      const user = await userRepository.update(userId, updateData);
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Delete user (Admin)
   */
  async deleteUser(userId) {
    try {
      const user = await userRepository.delete(userId);
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(userId, isActive) {
    try {
      const user = await userRepository.update(userId, { isActive });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    return userRepository.getStats();
  }
}

export default new UserService();
