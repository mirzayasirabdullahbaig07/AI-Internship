const http = require("node:http");
const { createDb, LAB_USERS } = require("../src/db");

const TARGET = process.env.TARGET || "secure";

function load(target) {
  if (target === "insecure") {
    const m = require("../lab/insecure/notesApi");
    return { create: m.createNotesHandler, hash: m.md5 };
  }
  const m = require("../src/notesApi");
  return { create: m.createNotesHandler, hash: m.hashPassword };
}

/** Real HTTP server on a random port, fresh seeded in-memory DB, captured log events. */
async function startServer({ now } = {}) {
  const impl = load(TARGET);
  const db = createDb(impl.hash);
  const logs = [];
  const server = http.createServer(impl.create(db, { log: (e) => logs.push(e), now }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    db,
    logs,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function call(base, method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) payload = raw;
  else if (body !== undefined) payload = JSON.stringify(body);
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function login(base, user) {
  const r = await call(base, "POST", "/api/login", {
    body: { email: user.email, password: user.password },
  });
  return { ...r, token: r.json && r.json.token };
}

module.exports = { TARGET, startServer, call, login, LAB_USERS };
