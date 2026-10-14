const http = require("node:http");
const { createDb } = require("../src/db");

const TARGET = process.env.TARGET || "fixed";

function loadHandlerFactory(target) {
  if (target === "vulnerable")
    return require("../lab/vulnerable/profileRoutes.v1").createProfileHandler;
  return require("../src/profileRoutes").createProfileHandler;
}

/** Starts a real HTTP server on a random port with a fresh seeded in-memory DB. */
async function startServer(target = TARGET) {
  const server = http.createServer(loadHandlerFactory(target)(createDb()));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((resolve) => server.close(resolve)) };
}

/** Real seeded users (see src/db.js). Tokens are lab-only. */
const USERS = {
  yasir: { id: 1, token: "token-yasir", name: "Mirza Yasir Abdullah Baig" },
  ayesha: { id: 2, token: "token-ayesha", name: "Ayesha Khan" },
  admin: { id: 3, token: "token-admin", name: "Internship Admin" },
};

async function get(base, path, token) {
  const res = await fetch(
    base + path,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  );
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* body was not JSON */
  }
  return { status: res.status, text, json };
}

/** True if the response text contains anything the caller (user 1) must never see. */
const SECRET_MARKERS = ["FAKE-HASH", "sk_test_FAKE", "password_hash", "api_key"];
const leaksSecrets = (text) => SECRET_MARKERS.some((m) => text.includes(m));
const leaksOthers = (text) =>
  text.includes("Ayesha") || text.includes("Internship Admin");

module.exports = { TARGET, startServer, USERS, get, leaksSecrets, leaksOthers };
