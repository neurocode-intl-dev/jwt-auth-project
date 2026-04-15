/**
 * jwt.utils.js
 *
 * Thin wrappers around jsonwebtoken so the rest of the app
 * never imports jsonwebtoken directly.
 */

const jwt = require("jsonwebtoken");
const { accessToken: atCfg, refreshToken: rtCfg } = require("../config/jwt.config");

// ── Access Token ────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * Payload: { sub: userId, email, role }
 */
function signAccessToken(payload) {
  return jwt.sign(payload, atCfg.secret, { expiresIn: atCfg.expiresIn });
}

/**
 * Verify an access token.  Returns decoded payload or throws.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, atCfg.secret);
}

// ── Refresh Token ───────────────────────────────────────────

/**
 * Sign a long-lived refresh token.
 * Payload: { sub: userId }  (minimal, no sensitive data)
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, rtCfg.secret, { expiresIn: rtCfg.expiresIn });
}

/**
 * Verify a refresh token.  Returns decoded payload or throws.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, rtCfg.secret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
