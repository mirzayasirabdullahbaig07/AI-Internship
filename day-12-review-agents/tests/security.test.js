/** @jest-environment node */
// Reproduces every Review Agent finding for PR #104 (see review-output/REVIEW_AGENT_OUTPUT.md).
// Run against the fixed code:       npx jest day-12-review-agents/tests/security.test.js
// Run against the vulnerable code:  npm run test:vulnerable   (expected to FAIL - that is the proof)
const {
  TARGET,
  startServer,
  USERS,
  get,
  leaksSecrets,
  leaksOthers,
} = require("./helpers");

let srv;
beforeAll(async () => {
  srv = await startServer();
});
afterAll(() => srv.close());

const yasir = USERS.yasir.token;
// NB: an explicit `undefined` token must mean "no token" (a default parameter would wrongly replace it).
const profile = (query, ...rest) =>
  get(srv.base, `/api/profile${query}`, rest.length ? rest[0] : yasir);

describe(`PR #104 security tests (target: ${TARGET})`, () => {
  test("happy path: signed-in user gets their own name", async () => {
    const r = await profile("?userId=1");
    expect(r.status).toBe(200);
    expect(r.text).toContain(USERS.yasir.name);
  });

  // ---- Finding 2: authorization bypass (IDOR) ----
  test("F2: client-supplied userId of another user (Ayesha) never returns her data", async () => {
    const r = await profile("?userId=2");
    expect(leaksOthers(r.text)).toBe(false);
  });

  test("F2: asking for the admin's id never returns admin data", async () => {
    const r = await profile("?userId=3");
    expect(leaksOthers(r.text)).toBe(false);
  });

  // ---- Finding 1: SQL injection ----
  test("F1: tautology injection (1 OR 1=1) does not dump other users", async () => {
    const r = await profile("?userId=" + encodeURIComponent("1 OR 1=1"));
    expect(leaksOthers(r.text)).toBe(false);
  });

  test("F1: UNION injection cannot read the admin's secrets", async () => {
    const payload =
      "0 UNION SELECT id,name,email,role,password_hash,api_key FROM users WHERE id=3";
    const r = await profile("?userId=" + encodeURIComponent(payload));
    expect(leaksOthers(r.text)).toBe(false);
    expect(leaksSecrets(r.text)).toBe(false);
  });

  // ---- Finding 3: data leakage ----
  test("F3: own profile never exposes password_hash or api_key", async () => {
    const r = await profile("?userId=1");
    expect(leaksSecrets(r.text)).toBe(false);
  });

  // ---- Finding 4: error disclosure ----
  test("F4: a malformed id does not leak database error text", async () => {
    const r = await profile("?userId=" + encodeURIComponent("1'"));
    expect(r.text).not.toMatch(/sql|syntax|unrecognized|near|sqlite/i);
  });

  // ---- Finding 5: unhappy paths (authentication) ----
  test.each([
    ["no token", undefined],
    ["bogus token", "not-a-real-token"],
    ["prototype-key token", "__proto__"],
  ])("F5: %s -> 401", async (_label, token) => {
    const r = await profile("?userId=1", token);
    expect(r.status).toBe(401);
    expect(leaksSecrets(r.text)).toBe(false);
  });

  test("F5: unknown route -> 404", async () => {
    const r = await get(srv.base, "/api/nope", yasir);
    expect(r.status).toBe(404);
  });
});

// The fixed API adds a by-id route with server-side authorization. Skipped for the vulnerable target.
const fixedOnly = TARGET === "vulnerable" ? describe.skip : describe;
fixedOnly("fixed API: GET /api/users/:id (server-side authorization)", () => {
  const byId = (id, ...rest) =>
    get(srv.base, `/api/users/${id}`, rest.length ? rest[0] : yasir);

  test("self -> 200 with exactly id, name, email", async () => {
    const r = await byId(1);
    expect(r.status).toBe(200);
    expect(Object.keys(r.json).sort()).toEqual(["email", "id", "name"]);
    expect(r.json.name).toBe(USERS.yasir.name);
  });

  test("another user's id -> 403", async () => {
    expect((await byId(2)).status).toBe(403);
  });

  test("a non-existent id as a normal user -> 403, not 404 (no user enumeration)", async () => {
    expect((await byId(999)).status).toBe(403);
  });

  test("admin may read another user but still never sees secrets", async () => {
    const r = await byId(2, USERS.admin.token);
    expect(r.status).toBe(200);
    expect(r.json.name).toBe("Ayesha Khan");
    expect(leaksSecrets(r.text)).toBe(false);
  });

  test("admin asking for a non-existent id -> 404", async () => {
    expect((await byId(999, USERS.admin.token)).status).toBe(404);
  });

  test.each([
    ["letters", "abc"],
    ["negative", "-1"],
    ["zero", "0"],
    ["decimal", "1.5"],
    ["tautology", encodeURIComponent("1 OR 1=1")],
    ["quote", encodeURIComponent("1'")],
    ["union", encodeURIComponent("0 UNION SELECT 1,2,3,4,5,6")],
    ["overflow", "99999999999999999999"],
    ["empty-ish", "%20"],
  ])("invalid id (%s) -> 400 with a generic message", async (_label, id) => {
    const r = await byId(id);
    expect(r.status).toBe(400);
    expect(r.text).not.toMatch(/sql|sqlite|syntax|near|stack/i);
  });

  test("no token on /api/users/:id -> 401", async () => {
    expect((await get(srv.base, "/api/users/1")).status).toBe(401);
  });

  test("/api/profile ignores a client-supplied userId and returns the caller", async () => {
    const r = await profile("?userId=2");
    expect(r.status).toBe(200);
    expect(r.json.id).toBe(1);
    expect(r.json.name).toBe(USERS.yasir.name);
  });

  test("non-GET methods are rejected with 405", async () => {
    const res = await fetch(`${srv.base}/api/users/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${yasir}` },
    });
    expect(res.status).toBe(405);
  });
});
