/**
 * jwt.config.js
 *
 * Central place for all JWT settings.
 * Access tokens are short-lived (15 min).
 * Refresh tokens are long-lived (7 days) and stored as HttpOnly cookies.
 */

module.exports = {
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || "dev_access_secret_change_me",
    expiresIn: "15m",
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_change_me",
    expiresIn: "7d",
    cookieName: "refreshToken",
    cookieOptions: {
      httpOnly: true,   // JS cannot read this cookie → protects against XSS
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    },
  },
};
