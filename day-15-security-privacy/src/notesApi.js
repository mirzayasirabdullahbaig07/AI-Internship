// Day 15 - secure version of the notes API (fixes every finding in review/OWASP_MISSING_CHECKS.md).
const crypto = require("node:crypto");

const MAX_BODY_BYTES = 10 * 1024;
const MAX_TITLE = 100;
const MAX_NOTE_BODY = 2000;
const MAX_NOTES_PER_USER = 50;
const SESSION_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** scrypt with a per-password random salt. Format: scrypt$<salt hex>$<hash hex>. */
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${crypto.scryptSync(String(password), salt, 32).toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt") return false;
  const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), 32);
  return crypto.timingSafeEqual(actual, Buffer.from(hashHex, "hex")); // constant-time compare
}
const DUMMY_HASH = hashPassword("dummy-password-for-timing");
const idHash = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (chunk) => {
      if (tooLarge) return; // discard the rest, but keep the socket open long enough to answer 413
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        reject(new HttpError(413, "Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) return;
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw === "") return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error();
        resolve(parsed);
      } catch {
        reject(new HttpError(400, "Invalid JSON"));
      }
    });
    req.on("error", () => reject(new HttpError(400, "Bad request")));
  });
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => "\\" + c);

function createNotesHandler(db, opts = {}) {
  const log = opts.log ?? (() => {});
  const now = opts.now ?? Date.now;
  const sessions = new Map(); // token -> { userId, expires }
  const failures = new Map(); // email -> { count, since }

  const byEmail = db.prepare("SELECT id, role, password_hash FROM users WHERE email = ?");
  const byId = db.prepare("SELECT id, role FROM users WHERE id = ?");
  const listNotes = db.prepare(
    "SELECT id, title, body FROM notes WHERE owner_id = ? AND title LIKE ? ESCAPE '\\' ORDER BY id",
  );
  const countNotes = db.prepare("SELECT COUNT(*) AS n FROM notes WHERE owner_id = ?");
  const insertNote = db.prepare(
    "INSERT INTO notes (owner_id, title, body) VALUES (?, ?, ?)",
  );
  const noteOwner = db.prepare("SELECT owner_id FROM notes WHERE id = ?");
  const deleteNote = db.prepare("DELETE FROM notes WHERE id = ?");

  function authenticate(req) {
    const match = /^Bearer ([0-9a-f]{64})$/.exec(req.headers.authorization || "");
    const session = match ? sessions.get(match[1]) : undefined;
    if (!session) return null;
    if (session.expires <= now()) {
      sessions.delete(match[1]);
      return null;
    }
    return byId.get(session.userId) ?? null;
  }

  function login(body) {
    const email = typeof body.email === "string" ? body.email.slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
    const record = failures.get(email);
    if (
      record &&
      now() - record.since < LOGIN_WINDOW_MS &&
      record.count >= MAX_LOGIN_FAILURES
    ) {
      log({ event: "login_rate_limited", who: idHash(email) });
      throw new HttpError(429, "Too many attempts. Try again later.");
    }
    const user = byEmail.get(email);
    const valid =
      verifyPassword(password, user ? user.password_hash : DUMMY_HASH) && Boolean(user); // same work either way
    if (!valid) {
      const fresh =
        record && now() - record.since < LOGIN_WINDOW_MS
          ? record
          : { count: 0, since: now() };
      failures.set(email, { count: fresh.count + 1, since: fresh.since });
      log({ event: "login_failed", who: idHash(email) });
      throw new HttpError(401, "Invalid email or password"); // identical for unknown user and wrong password
    }
    failures.delete(email);
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { userId: user.id, expires: now() + SESSION_MS });
    log({ event: "login_ok", who: idHash(email) });
    return { token, expiresInSeconds: SESSION_MS / 1000 };
  }

  async function route(req, url) {
    if (req.method === "POST" && url.pathname === "/api/login")
      return [200, login(await readJson(req))];

    const caller = authenticate(req);
    if (!caller) throw new HttpError(401, "Unauthorized");

    if (req.method === "GET" && url.pathname === "/api/notes") {
      const search = url.searchParams.get("search") ?? "";
      if (search.length > MAX_TITLE) throw new HttpError(400, "Search too long");
      return [
        200,
        listNotes
          .all(caller.id, `%${escapeLike(search)}%`)
          .map((n) => ({ id: n.id, title: n.title, body: n.body })),
      ];
    }
    if (req.method === "POST" && url.pathname === "/api/notes") {
      const body = await readJson(req);
      if (
        typeof body.title !== "string" ||
        body.title.trim() === "" ||
        body.title.length > MAX_TITLE
      )
        throw new HttpError(400, `title must be 1-${MAX_TITLE} characters`);
      const text = body.body ?? "";
      if (typeof text !== "string" || text.length > MAX_NOTE_BODY)
        throw new HttpError(400, `body must be at most ${MAX_NOTE_BODY} characters`);
      if (countNotes.get(caller.id).n >= MAX_NOTES_PER_USER)
        throw new HttpError(429, "Note limit reached");
      // The owner is ALWAYS the authenticated caller; any owner_id in the request is ignored.
      const info = insertNote.run(caller.id, body.title, text);
      return [201, { id: Number(info.lastInsertRowid), title: body.title, body: text }];
    }
    const del = /^\/api\/notes\/([1-9]\d{0,8})$/.exec(url.pathname);
    if (req.method === "DELETE" && del) {
      const id = Number(del[1]);
      const note = noteOwner.get(id);
      if (!note || (note.owner_id !== caller.id && caller.role !== "admin")) {
        if (note)
          log({
            event: "access_denied",
            userId: caller.id,
            action: "delete_note",
            noteId: id,
          });
        throw new HttpError(404, "Not found"); // not-yours and does-not-exist look identical
      }
      deleteNote.run(id);
      log({ event: "note_deleted", userId: caller.id, noteId: id });
      return [200, { deleted: true }];
    }
    throw new HttpError(404, "Not found");
  }

  return async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    let status = 200;
    let payload;
    try {
      [status, payload] = await route(req, new URL(req.url, "http://localhost"));
    } catch (err) {
      if (err instanceof HttpError) {
        status = err.status;
        payload = { error: err.message };
        if (status === 429) res.setHeader("Retry-After", String(LOGIN_WINDOW_MS / 1000));
        if (status === 413) res.setHeader("Connection", "close"); // do not keep reading an oversized upload
      } else {
        log({ event: "unexpected_error", message: String(err && err.message) }); // details stay on the server
        status = 500;
        payload = { error: "Internal server error" };
      }
    }
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  };
}

module.exports = { createNotesHandler, hashPassword, verifyPassword };
