/**
 * auth.controller.js
 *
 * Handles:
 *  POST /api/auth/register
 *  POST /api/auth/login
 *  POST /api/auth/refresh
 *  POST /api/auth/logout
 */

const userModel = require("../models/user.model");
const tokenStore = require("../models/tokenStore");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.utils");
const { refreshToken: rtCfg } = require("../config/jwt.config");

// ── Helpers ─────────────────────────────────────────────────

function issueTokens(res, user) {
  // Build access token payload
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // Build refresh token payload (minimal)
  const refreshToken = signRefreshToken({ sub: user.id });

  // Persist refresh token in the whitelist
  tokenStore.add(user.id, refreshToken);

  // Send refresh token as an HttpOnly cookie (never readable by JS)
  res.cookie(rtCfg.cookieName, refreshToken, rtCfg.cookieOptions);

  return accessToken;
}

// ── Register ─────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await userModel.create({ email, password });
    const accessToken = issueTokens(res, user);

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user,
    });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await userModel.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const safeUser = { id: user.id, email: user.email, role: user.role };
    const accessToken = issueTokens(res, safeUser);

    return res.json({
      message: "Logged in successfully",
      accessToken,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── Refresh ───────────────────────────────────────────────────
//
// Flow:
//  1. Read the refresh token from the HttpOnly cookie.
//  2. Verify the JWT signature & expiry.
//  3. Check the token is still in the whitelist (prevents reuse after logout).
//  4. ROTATE: remove old token, issue a brand-new pair.

async function refresh(req, res, next) {
  try {
    const oldRefreshToken = req.cookies[rtCfg.cookieName];

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // Verify signature / expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      return res
        .status(403)
        .json({ message: "Refresh token expired or invalid" });
    }

    const userId = decoded.sub;

    // Check whitelist
    if (!tokenStore.has(userId, oldRefreshToken)) {
      // Token reuse detected → revoke all tokens for this user (security measure)
      tokenStore.removeAll(userId);
      res.clearCookie(rtCfg.cookieName, rtCfg.cookieOptions);
      return res
        .status(403)
        .json({ message: "Token reuse detected. Please log in again." });
    }

    // Rotate: delete old token
    tokenStore.remove(userId, oldRefreshToken);

    // Look up the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const safeUser = { id: user.id, email: user.email, role: user.role };

    // Issue new pair
    const accessToken = issueTokens(res, safeUser);

    return res.json({
      message: "Token refreshed",
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────

async function logout(req, res, next) {
  try {
    const token = req.cookies[rtCfg.cookieName];

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        tokenStore.remove(decoded.sub, token);
      } catch {
        // Token was already expired — that's fine, just clear the cookie
      }
    }

    res.clearCookie(rtCfg.cookieName, rtCfg.cookieOptions);
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
