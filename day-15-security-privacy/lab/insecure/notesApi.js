// ############################################################################
// INTENTIONALLY INSECURE - Day 15 lab only. Never import or deploy this file.
// It is the "before" picture for the OWASP Top 10:2025 review and the tests.
// ############################################################################
const crypto = require("node:crypto");

const md5 = (s) => crypto.createHash("md5").update(String(s)).digest("hex");

function createNotesHandler(db, opts = {}) {
  const log = opts.log ?? (() => {});

  return (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    log({ msg: "request", method: req.method, url: req.url, headers: req.headers });
    const url = new URL(req.url, "http://localhost");
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const send = (status, data) => {
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        if (req.method === "POST" && url.pathname === "/api/login") {
          const user = db
            .prepare("SELECT * FROM users WHERE email = '" + body.email + "'")
            .get();
          if (!user) return send(404, { error: "No such user" });
          if (user.password_hash !== md5(body.password))
            return send(401, { error: "Wrong password" });
          log({ msg: "login ok", email: body.email, password: body.password });
          const token = Buffer.from(user.id + ":" + user.email).toString("base64");
          return send(200, { token, user });
        }

        const bearer = /^Bearer (.+)$/.exec(req.headers.authorization || "");
        const callerId = bearer
          ? Number(Buffer.from(bearer[1], "base64").toString().split(":")[0])
          : NaN;
        const caller = Number.isNaN(callerId)
          ? undefined
          : db.prepare("SELECT * FROM users WHERE id = " + callerId).get();
        if (!caller) return send(401, { error: "Unauthorized" });

        if (req.method === "GET" && url.pathname === "/api/notes") {
          const search = url.searchParams.get("search") || "";
          const rows = db
            .prepare(
              "SELECT notes.*, users.email AS owner_email FROM notes JOIN users ON users.id = notes.owner_id WHERE notes.title LIKE '%" +
                search +
                "%'",
            )
            .all();
          return send(200, rows);
        }
        if (req.method === "POST" && url.pathname === "/api/notes") {
          const ownerId = body.owner_id ?? caller.id;
          const info = db
            .prepare("INSERT INTO notes (owner_id, title, body) VALUES (?, ?, ?)")
            .run(ownerId, body.title, body.body ?? "");
          return send(201, {
            id: Number(info.lastInsertRowid),
            owner_id: ownerId,
            title: body.title,
            body: body.body,
          });
        }
        const del = /^\/api\/notes\/(\d+)$/.exec(url.pathname);
        if (req.method === "DELETE" && del) {
          db.prepare("DELETE FROM notes WHERE id = ?").run(Number(del[1]));
          return send(200, { deleted: true });
        }
        return send(404, { error: "Not found" });
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message, stack: err.stack }));
      }
    });
  };
}

module.exports = { createNotesHandler, md5 };
