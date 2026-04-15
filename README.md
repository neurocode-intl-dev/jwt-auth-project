# JWT Auth — Node.js Refresher Project

A complete, fully-commented Express.js project covering the most important
authentication patterns you'll use in production.

---

## Project Layout

```
src/
  app.js                 ← Express app (middleware + routes wired together)
  server.js              ← Starts the HTTP server
  config/
    jwt.config.js        ← Token secrets, expiry times, cookie settings
  models/
    user.model.js        ← In-memory user store (replace with DB in prod)
    tokenStore.js        ← Refresh token whitelist (replace with Redis/DB)
  utils/
    jwt.utils.js         ← sign / verify helpers for both token types
  controllers/
    auth.controller.js   ← register, login, refresh, logout logic
    user.controller.js   ← protected route handlers
  middlewares/
    auth.middleware.js   ← authenticate (Bearer) + authorize (roles)
    error.middleware.js  ← global error handler
  routes/
    auth.routes.js       ← /api/auth/*
    user.routes.js       ← /api/users/*
tests/
  auth.test.js           ← Integration tests (supertest + Jest)
```

---

## Key Concepts

### 1. Two-Token Strategy

| Token        | Lifetime | Where stored            | Purpose                         |
|--------------|----------|-------------------------|---------------------------------|
| Access token | 15 min   | JS memory / header      | Authorize API calls             |
| Refresh token| 7 days   | HttpOnly cookie         | Issue new access tokens silently|

- **Access token** travels in the `Authorization: Bearer <token>` header.
- **Refresh token** lives in an HttpOnly cookie — JS cannot read it, protecting against XSS.

### 2. Refresh Token Rotation

Every time you call `POST /api/auth/refresh`:
1. The old refresh token is **deleted** from the whitelist.
2. A brand-new refresh token is issued and stored.

This means a stolen refresh token can only be used **once**. If it's used again,
all tokens for that user are immediately revoked (reuse detection).

### 3. Role-Based Authorization

```js
router.get("/admin", authenticate, authorize("admin"), handler);
```

`authenticate` — verifies the JWT signature and attaches `req.user`.  
`authorize(role)` — checks `req.user.role` against the allowed list.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Start the dev server
npm run dev

# 4. Run tests
npm test
```

---

## API Reference

### Auth (public)

| Method | Path                  | Body                     | Description              |
|--------|-----------------------|--------------------------|--------------------------|
| POST   | /api/auth/register    | `{ email, password }`    | Create account           |
| POST   | /api/auth/login       | `{ email, password }`    | Log in                   |
| POST   | /api/auth/refresh     | _(cookie)_               | Rotate tokens            |
| POST   | /api/auth/logout      | _(cookie)_               | Revoke refresh token     |

### Users (protected — Bearer token required)

| Method | Path           | Role  | Description           |
|--------|----------------|-------|-----------------------|
| GET    | /api/users/me  | any   | Get own profile       |
| GET    | /api/users     | admin | List all users        |

---

## What to Learn Next

1. **Persist to a real DB** — swap `user.model.js` for Mongoose / Prisma.
2. **Store refresh tokens in Redis** — swap `tokenStore.js` for `ioredis`.
3. **Add rate limiting** — `express-rate-limit` on `/api/auth/login`.
4. **Add input validation** — `zod` or `express-validator` before controllers.
5. **HTTPS in production** — required for `secure: true` on the cookie.
