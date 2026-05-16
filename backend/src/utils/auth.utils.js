import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import envConfig from "../config/env.config.js";

/**
 * Hash a plain-text password
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Compare a plain-text password against a stored hash
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate a short-lived JWT access token
 * @param {{ id: string, role: string }} user
 * @returns {string}
 */
export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    envConfig.jwtAccessSecret,
    { expiresIn: envConfig.jwtAccessExpiry },
  );
}

/**
 * Generate a long-lived JWT refresh token
 * @param {{ id: string }} user
 * @returns {string}
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    envConfig.jwtRefreshSecret,
    { expiresIn: envConfig.jwtRefreshExpiry },
  );
}

/**
 * Verify a JWT token and return the decoded payload
 * @param {string} token
 * @param {string} secret
 * @returns {object}
 */
export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}
