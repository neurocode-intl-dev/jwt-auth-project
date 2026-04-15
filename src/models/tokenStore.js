/**
 * tokenStore.js  –  In-memory refresh-token whitelist
 *
 * Stores valid refresh tokens per user.
 * On refresh:  old token is removed, new token is stored  (rotation).
 * On logout:   all tokens for the user are removed.
 *
 * In production replace with Redis or a DB table.
 */

// Map<userId, Set<refreshToken>>
const store = new Map();

function add(userId, token) {
  if (!store.has(userId)) store.set(userId, new Set());
  store.get(userId).add(token);
}

function has(userId, token) {
  return store.has(userId) && store.get(userId).has(token);
}

function remove(userId, token) {
  if (store.has(userId)) {
    store.get(userId).delete(token);
  }
}

function removeAll(userId) {
  store.delete(userId);
}

module.exports = { add, has, remove, removeAll };
