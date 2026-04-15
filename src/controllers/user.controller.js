/**
 * user.controller.js
 *
 * Protected endpoints that require a valid access token.
 */

const userModel = require("../models/user.model");

/**
 * GET /api/users/me
 * Returns the profile of the currently authenticated user.
 */
async function getMe(req, res) {
  const user = await userModel.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
}

/**
 * GET /api/users  (admin only)
 * Returns all registered users.
 */
function getAllUsers(req, res) {
  // In a real app you'd query the DB here
  return res.json({ message: "Admin-only: list of all users (placeholder)" });
}

module.exports = { getMe, getAllUsers };
