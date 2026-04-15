/**
 * user.model.js  –  In-memory "database"
 *
 * In a real app this would be Mongoose / Prisma / Sequelize, etc.
 * Keeping it in-memory so you can run the project with zero setup.
 */

const bcrypt = require("bcryptjs");

const users = []; // { id, email, passwordHash, role }

/**
 * Find a user by email (case-insensitive).
 */
function findByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find a user by id.
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Create a new user, hashing the plain-text password first.
 * Returns the created user (without the hash).
 */
async function create({ email, password, role = "user" }) {
  if (findByEmail(email)) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `user_${Date.now()}`,
    email,
    passwordHash,
    role,
  };

  users.push(user);

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Validate a plain-text password against a stored hash.
 */
async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = { findByEmail, findById, create, verifyPassword };
