import prisma from "../config/prisma.js";

/**
 * User Repository — all DB access for the users table.
 * Services must not import prisma directly.
 */
class UserRepository {
  /** @private Fields always excluded from public responses */
  #safeSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    avatar: true,
    isActive: true,
    isVerified: true,
    isEmailVerified: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * Normalise a Prisma user row to a DTO-compatible shape.
   * Maps Prisma `id` → `_id` for compatibility with existing DTOs.
   */
  #normalise(user) {
    if (!user) return null;
    const { id, ...rest } = user;
    return { id, ...rest };
  }

  /**
   * Find user by email.
   * @param {string} email
   * @param {boolean} includePassword - also return hashed password
   * @param {boolean} includeRefreshToken
   */
  async findByEmail(email, includePassword = false, includeRefreshToken = false) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        ...this.#safeSelect,
        ...(includePassword ? { password: true } : {}),
        ...(includeRefreshToken ? { refreshToken: true } : {}),
      },
    });
    return this.#normalise(user);
  }

  /**
   * Find user by id.
   * @param {string} id
   * @param {boolean} includePassword
   * @param {boolean} includeRefreshToken
   */
  async findById(id, includePassword = false, includeRefreshToken = false) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...this.#safeSelect,
        ...(includePassword ? { password: true } : {}),
        ...(includeRefreshToken ? { refreshToken: true } : {}),
      },
    });
    return this.#normalise(user);
  }

  /**
   * Create a new user. Password must already be hashed by the caller.
   */
  async create({ name, email, hashedPassword, role = "CUSTOMER", phone }) {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role.toUpperCase(),
        phone: phone || null,
      },
      select: this.#safeSelect,
    });
    return this.#normalise(user);
  }

  /**
   * Save or clear the refresh token for a user.
   * @param {string} id
   * @param {string|null} token - pass null to clear
   */
  async updateRefreshToken(id, token) {
    await prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  /**
   * Update hashed password. Password must be pre-hashed by caller.
   */
  async updatePassword(id, hashedPassword) {
    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: this.#safeSelect,
    });
    return this.#normalise(user);
  }

  /**
   * Update allowed profile fields.
   */
  async updateProfile(id, { name, phone, avatar }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: this.#safeSelect,
    });
    return this.#normalise(user);
  }

  /**
   * Admin: find many users with optional role/search filter + pagination.
   */
  async findMany({ role, search, skip = 0, limit = 10 }) {
    const where = {};

    if (role) where.role = role.toUpperCase();

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: this.#safeSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users.map((u) => this.#normalise(u)), total };
  }

  /**
   * Admin: update any user fields.
   */
  async update(id, data) {
    if (data.role) data.role = data.role.toUpperCase();
    const user = await prisma.user.update({
      where: { id },
      data,
      select: this.#safeSelect,
    });
    return this.#normalise(user);
  }

  /**
   * Admin: hard-delete a user.
   */
  async delete(id) {
    const user = await prisma.user.delete({
      where: { id },
      select: this.#safeSelect,
    });
    return this.#normalise(user);
  }

  /**
   * Count total, active users and group by role.
   */
  async getStats() {
    const [totalUsers, activeUsers, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole: byRole.map((r) => ({
        _id: r.role.toLowerCase(),
        count: r._count.role,
      })),
    };
  }
}

export default new UserRepository();
