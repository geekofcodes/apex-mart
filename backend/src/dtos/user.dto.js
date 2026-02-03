/**
 * User DTOs - Data Transfer Objects for User Management
 * Ensures API responses don't expose sensitive data
 */

class UserDTO {
  /**
   * Basic user response DTO
   */
  static userResponse(user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      avatar: user.avatar || null,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Detailed user response DTO (for profile/admin views)
   */
  static detailedUserResponse(user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      avatar: user.avatar || null,
      address: user.address || {
        street: null,
        city: null,
        state: null,
        zipCode: null,
        country: "India",
      },
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * User list response DTO (for admin list views)
   */
  static userListResponse(users) {
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }

  /**
   * Minimal user response (for references in other entities)
   */
  static minimalUserResponse(user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    };
  }
}

export default UserDTO;
