// PR #104 - fixed after the Day 12 Review Agent audit (findings F1-F5).
const { authenticate } = require("./auth");

/** Positive integer, at most 9 digits. Anything else is rejected before it reaches the database. */
const ID_PATTERN = /^[1-9]\d{0,8}$/;
/** F3: explicit allow-list. password_hash and api_key can never be selected, so they can never leak. */
const PUBLIC_COLUMNS = "id, name, email";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function createProfileHandler(db) {
  // F1: parameterized statements - user input is bound as data, never concatenated into SQL.
  const publicById = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`);
  const roleById = db.prepare("SELECT role FROM users WHERE id = ?");

  return (req, res) => {
    const url = new URL(req.url, "http://localhost");

    const byIdMatch = /^\/api\/users\/([^/]*)$/.exec(url.pathname);
    if (url.pathname !== "/api/profile" && !byIdMatch)
      return send(res, 404, { error: "Not found" });
    if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

    // Identity always comes from the verified session, never from the request.
    const callerId = authenticate(req);
    if (callerId === null) return send(res, 401, { error: "Unauthorized" });

    // F2: /api/profile is "me". Any client-supplied userId is ignored.
    let targetId = callerId;
    if (byIdMatch) {
      const raw = byIdMatch[1];
      if (!ID_PATTERN.test(raw)) return send(res, 400, { error: "Invalid user id" });
      targetId = Number(raw);
    }

    // F2: server-side authorization - self or admin only. 403 (not 404) so ids cannot be enumerated.
    if (targetId !== callerId && roleById.get(callerId)?.role !== "admin") {
      return send(res, 403, { error: "Forbidden" });
    }

    try {
      const row = publicById.get(targetId);
      if (!row) return send(res, 404, { error: "Not found" });
      return send(res, 200, { id: row.id, name: row.name, email: row.email });
    } catch (err) {
      // F4: log details server-side only; the client gets a generic message.
      console.error("profile lookup failed:", err);
      return send(res, 500, { error: "Internal server error" });
    }
  };
}

module.exports = { createProfileHandler };
