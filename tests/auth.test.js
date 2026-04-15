/**
 * auth.test.js
 *
 * Integration tests covering the full auth lifecycle:
 *  register → login → access protected route → refresh token → logout
 *
 * Run with:  npm test
 */

const request = require("supertest");
const app = require("../src/app");

// Cookie jar helper – extracts Set-Cookie header value
function getCookie(res, name) {
  const cookies = res.headers["set-cookie"] || [];
  const found = cookies.find((c) => c.startsWith(`${name}=`));
  return found ? found.split(";")[0] : null;
}

describe("Auth flow", () => {
  let accessToken;
  let refreshCookie;

  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: "Str0ng!Pass",
  };

  // ── Register ──────────────────────────────────────────────

  test("POST /api/auth/register – creates a user and returns tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toMatchObject({ email: testUser.email, role: "user" });

    accessToken = res.body.accessToken;
    refreshCookie = getCookie(res, "refreshToken");
    expect(refreshCookie).toBeTruthy();
  });

  test("POST /api/auth/register – rejects duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(500); // our error handler converts the thrown Error → 500
  });

  // ── Login ─────────────────────────────────────────────────

  test("POST /api/auth/login – returns access token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send(testUser)
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    accessToken = res.body.accessToken;
    refreshCookie = getCookie(res, "refreshToken");
  });

  test("POST /api/auth/login – rejects wrong password", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrong" })
      .expect(401);
  });

  // ── Protected route ───────────────────────────────────────

  test("GET /api/users/me – returns profile with valid access token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user).toMatchObject({ email: testUser.email });
  });

  test("GET /api/users/me – returns 401 without token", async () => {
    await request(app).get("/api/users/me").expect(401);
  });

  // ── Refresh ───────────────────────────────────────────────

  test("POST /api/auth/refresh – issues new access token using cookie", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie)
      .expect(200);

    expect(res.body).toHaveProperty("accessToken");
    accessToken = res.body.accessToken; // rotate our copy too
    refreshCookie = getCookie(res, "refreshToken");
  });

  test("POST /api/auth/refresh – rejects if cookie missing", async () => {
    await request(app).post("/api/auth/refresh").expect(401);
  });

  // ── Logout ────────────────────────────────────────────────

  test("POST /api/auth/logout – clears cookie", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", refreshCookie)
      .expect(200);

    expect(res.body.message).toMatch(/logged out/i);
  });

  test("POST /api/auth/refresh – rejected after logout (token revoked)", async () => {
    await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie)
      .expect(403); // token was removed from whitelist
  });
});
