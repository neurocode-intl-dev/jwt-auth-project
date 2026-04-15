const bcrypt = require("bcryptjs");
const { init, getPool } = require("./db");

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

async function findByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  await init();
  const pool = getPool();
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    normalizedEmail,
  ]);
  return rows[0] || null;
}

async function findById(id) {
  if (!id) return null;

  await init();
  const pool = getPool();
  const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

async function create({ email, password, role = "user" }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    const err = new Error("email and password are required");
    err.statusCode = 400;
    throw err;
  }

  if (await findByEmail(normalizedEmail)) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `user_${Date.now()}`,
    email: normalizedEmail,
    passwordHash,
    role,
  };

  await init();
  const pool = getPool();
  await pool.execute(
    "INSERT INTO users (id, email, passwordHash, role) VALUES (?, ?, ?, ?)",
    [user.id, user.email, user.passwordHash, user.role],
  );

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = { findByEmail, findById, create, verifyPassword };
