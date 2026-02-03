import User from "../models/user.model.js";
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

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

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
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  /**
   * Update user (Admin)
   */
  async updateUser(userId, updateData) {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  /**
   * Delete user (Admin)
   */
  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(userId, isActive) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true },
    );
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
    };
  }
}

export default new UserService();
