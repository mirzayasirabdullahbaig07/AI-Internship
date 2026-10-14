/** @jest-environment node */
// Reproduces the OWASP Top 10:2025 findings for the notes API (see review/OWASP_MISSING_CHECKS.md).
// Secure code:      npx jest day-15-security-privacy
// Insecure code:    npm run test:insecure   (EXPECTED to fail - the failures are the proof)
const crypto = require("node:crypto");
const { TARGET, startServer, call, login, LAB_USERS } = require("./helpers");

const { yasir, ayesha, admin } = LAB_USERS;
let srv;
beforeEach(async () => {
  srv = await startServer();
});
afterEach(() => srv.close());

const titles = (r) => (Array.isArray(r.json) ? r.json.map((n) => n.title) : []);
const noteExists = (id) =>
  Boolean(srv.db.prepare("SELECT 1 AS x FROM notes WHERE id = ?").get(id));
const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");

describe(`Notes API security (target: ${TARGET})`, () => {
  describe("A01 Broken Access Control", () => {
    test("a user cannot delete someone else's note (and the note survives)", async () => {
      const { token } = await login(srv.base, ayesha);
      const r = await call(srv.base, "DELETE", "/api/notes/1", { token });
      expect([403, 404]).toContain(r.status);
      expect(noteExists(1)).toBe(true);
    });
    test("an owner can delete their own note", async () => {
      const { token } = await login(srv.base, yasir);
      expect((await call(srv.base, "DELETE", "/api/notes/1", { token })).status).toBe(
        200,
      );
      expect(noteExists(1)).toBe(false);
    });
    test("an admin can delete any note", async () => {
      const { token } = await login(srv.base, admin);
      expect((await call(srv.base, "DELETE", "/api/notes/1", { token })).status).toBe(
        200,
      );
    });
    test("owner_id in a POST body is ignored: the caller always owns what they create", async () => {
      const { token } = await login(srv.base, ayesha);
      const r = await call(srv.base, "POST", "/api/notes", {
        token,
        body: { title: "Planted", owner_id: 1 },
      });
      expect(r.status).toBe(201);
      expect(
        srv.db.prepare("SELECT owner_id FROM notes WHERE title = 'Planted'").get()
          .owner_id,
      ).toBe(ayesha.id);
    });
    test("listing notes returns only the caller's notes", async () => {
      const { token } = await login(srv.base, ayesha);
      expect(titles(await call(srv.base, "GET", "/api/notes", { token }))).toEqual([
        "Shopping list",
      ]);
    });
  });

  describe("A02 Security Misconfiguration", () => {
    test("secure response headers are set and CORS is not wide open", async () => {
      const { token } = await login(srv.base, yasir);
      const r = await call(srv.base, "GET", "/api/notes", { token });
      expect(r.headers.get("x-content-type-options")).toBe("nosniff");
      expect(r.headers.get("cache-control")).toContain("no-store");
      expect(r.headers.get("access-control-allow-origin")).toBeNull();
    });
  });

  describe("A04 Cryptographic Failures", () => {
    test("passwords are stored with a salted slow hash, not MD5", () => {
      const { password_hash: stored } = srv.db
        .prepare("SELECT password_hash FROM users WHERE id = 1")
        .get();
      expect(stored).not.toBe(md5(yasir.password));
      expect(stored).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
    });
    test("session tokens are random (two logins differ) and long", async () => {
      const a = await login(srv.base, yasir);
      const b = await login(srv.base, yasir);
      expect(a.token).toBeTruthy();
      expect(a.token).not.toBe(b.token);
      expect(a.token.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe("A05 Injection", () => {
    test("SQL injection in the search term does not expose other users' notes", async () => {
      const { token } = await login(srv.base, ayesha);
      const r = await call(
        srv.base,
        "GET",
        "/api/notes?search=" + encodeURIComponent("' OR 1=1 --"),
        { token },
      );
      expect(titles(r)).not.toContain("Private: interview prep");
    });
    test("a malformed search term does not produce a database error", async () => {
      const { token } = await login(srv.base, ayesha);
      const r = await call(
        srv.base,
        "GET",
        "/api/notes?search=" + encodeURIComponent("it's"),
        { token },
      );
      expect(r.status).toBe(200);
      expect(r.text).not.toMatch(/sql|syntax|unrecognized|near/i);
    });
    test("SQL injection in login (UNION SELECT) cannot log an attacker in as the admin", async () => {
      const email = `x' UNION SELECT 3,'Internship Admin','admin@example.test','admin','${md5("attacker-pw")}' --`;
      const r = await call(srv.base, "POST", "/api/login", {
        body: { email, password: "attacker-pw" }, // secret-scan:allow (fake value for an injection test)
      });
      expect(r.status).toBe(401);
      expect(r.json && r.json.token).toBeUndefined();
    });
  });

  describe("A06 Insecure Design (limits)", () => {
    test("title and body have length limits", async () => {
      const { token } = await login(srv.base, ayesha);
      expect(
        (
          await call(srv.base, "POST", "/api/notes", {
            token,
            body: { title: "t".repeat(101) },
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await call(srv.base, "POST", "/api/notes", {
            token,
            body: { title: "ok", body: "b".repeat(2001) },
          })
        ).status,
      ).toBe(400);
    });
    test("a user cannot create unlimited notes", async () => {
      const { token } = await login(srv.base, ayesha);
      let last = 0;
      let created = 0;
      for (let i = 0; i < 60 && last !== 429; i++) {
        last = (
          await call(srv.base, "POST", "/api/notes", { token, body: { title: `n${i}` } })
        ).status;
        if (last === 201) created++;
      }
      expect(last).toBe(429);
      expect(created).toBeLessThanOrEqual(49);
    });
    test("an oversized request body is refused (413)", async () => {
      const { token } = await login(srv.base, ayesha);
      const r = await call(srv.base, "POST", "/api/notes", {
        token,
        body: { title: "x", body: "a".repeat(20 * 1024) },
      });
      expect(r.status).toBe(413);
    });
  });

  describe("A07 Authentication Failures", () => {
    test("unknown user and wrong password are indistinguishable (no user enumeration)", async () => {
      const unknown = await call(srv.base, "POST", "/api/login", {
        body: { email: "nobody@example.test", password: "x" },
      });
      const wrong = await call(srv.base, "POST", "/api/login", {
        body: { email: ayesha.email, password: "wrong" },
      });
      expect(unknown.status).toBe(wrong.status);
      expect(unknown.text).toBe(wrong.text);
    });
    test("login is rate limited: 5 failures lock the account (429), even for the right password", async () => {
      for (let i = 0; i < 5; i++) {
        const r = await call(srv.base, "POST", "/api/login", {
          body: { email: ayesha.email, password: `wrong${i}` },
        });
        expect(r.status).toBe(401);
      }
      const locked = await call(srv.base, "POST", "/api/login", {
        body: { email: ayesha.email, password: ayesha.password },
      });
      expect(locked.status).toBe(429);
    });
    test("a forged token (base64 of id:email) is rejected", async () => {
      const forged = Buffer.from(`${yasir.id}:${yasir.email}`).toString("base64");
      expect((await call(srv.base, "GET", "/api/notes", { token: forged })).status).toBe(
        401,
      );
    });
    test("sessions expire", async () => {
      let t = 1_000_000;
      await srv.close();
      srv = await startServer({ now: () => t });
      const { token } = await login(srv.base, yasir);
      expect((await call(srv.base, "GET", "/api/notes", { token })).status).toBe(200);
      t += 16 * 60 * 1000;
      expect((await call(srv.base, "GET", "/api/notes", { token })).status).toBe(401);
    });
  });

  describe("A09 Security Logging & Alerting + privacy", () => {
    test("logs never contain passwords or tokens", async () => {
      const { token } = await login(srv.base, yasir);
      await call(srv.base, "GET", "/api/notes", { token });
      const dump = JSON.stringify(srv.logs);
      expect(dump).not.toContain(yasir.password);
      expect(dump).not.toContain(token);
    });
    test("failed logins and denied actions produce security events", async () => {
      await call(srv.base, "POST", "/api/login", {
        body: { email: ayesha.email, password: "wrong" },
      });
      const { token } = await login(srv.base, ayesha);
      await call(srv.base, "DELETE", "/api/notes/1", { token });
      const events = srv.logs.map((l) => l.event);
      expect(events).toContain("login_failed");
      expect(events).toContain("access_denied");
    });
    test("responses expose no more personal data than needed (no emails, no hashes)", async () => {
      const loginRes = await login(srv.base, ayesha);
      expect(loginRes.text).not.toMatch(/password_hash|@/);
      const list = await call(srv.base, "GET", "/api/notes", { token: loginRes.token });
      expect(Object.keys(list.json[0]).sort()).toEqual(["body", "id", "title"]);
    });
  });

  describe("A10 Mishandling of Exceptional Conditions", () => {
    test("invalid JSON gives a clean 400 with no stack trace", async () => {
      const r = await call(srv.base, "POST", "/api/login", { raw: "{not json" });
      expect(r.status).toBe(400);
      expect(r.text).not.toMatch(/stack|\bat .*:\d+:\d+/);
    });
  });
});
