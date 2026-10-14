/** Lab-only session store: bearer token -> user id. Map (not a plain object) so "__proto__" is not a valid key. */
const SESSIONS = new Map([
  ["token-yasir", 1],
  ["token-ayesha", 2],
  ["token-admin", 3],
]);

/** Returns the authenticated user id from the Authorization header, or null. */
function authenticate(req) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!match) return null;
  return SESSIONS.get(match[1]) ?? null;
}

module.exports = { authenticate, SESSIONS };
