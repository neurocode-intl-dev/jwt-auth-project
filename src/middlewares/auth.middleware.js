/**
 * auth.middleware.js
 *
 * authenticate  – verifies the Bearer access token on every protected route.
 * authorize     – checks the user's role against an allowed list.
 *
 * Usage:
 *   router.get("/profile", authenticate, getProfile);
 *   router.delete("/users/:id", authenticate, authorize("admin"), deleteUser);
 */

const { verifyAccessToken } = require("../utils/jwt.utils");

/**
 * Extracts and verifies the access token from the Authorization header.
 * On success: attaches `req.user = { sub, email, role, iat, exp }` and calls next().
 * On failure: responds with 401.
 *
 * Header expected:  Authorization: Bearer <accessToken>
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // attach to request so controllers can use it
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(403).json({ message: "Invalid access token" });
  }
}

/**
 * Role-based authorization factory.
 * authorize("admin")          → only admins
 * authorize("admin", "editor") → admins or editors
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
