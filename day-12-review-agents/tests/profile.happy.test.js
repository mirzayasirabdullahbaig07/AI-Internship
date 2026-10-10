/** @jest-environment node */
// The single test PR #104 shipped, updated to the fixed contract (a single object, not an array of rows).
const { startServer, USERS, get } = require("./helpers");

let srv;
beforeAll(async () => {
  srv = await startServer("fixed");
});
afterAll(() => srv.close());

test("returns the signed-in user's own profile", async () => {
  const r = await get(srv.base, "/api/profile", USERS.yasir.token);
  expect(r.status).toBe(200);
  expect(r.json).toEqual({
    id: 1,
    name: "Mirza Yasir Abdullah Baig",
    email: "mirzayasirabdullahbaig07@users.noreply.github.com",
  });
});
