// Prints the REAL responses of both implementations to the same attacks (used as report evidence).
// Run: node day-12-review-agents/tools/show_attacks.js
const { createDemoServer } = require("../src/server");

const T = "token-yasir"; // Mirza Yasir Abdullah Baig, user id 1, role user
const enc = encodeURIComponent;
const ATTACKS = [
  ["Own profile", `/api/profile?userId=1`, `/api/profile`],
  ["IDOR: Ayesha's id", `/api/profile?userId=2`, `/api/users/2`],
  [
    "SQLi tautology",
    `/api/profile?userId=${enc("1 OR 1=1")}`,
    `/api/users/${enc("1 OR 1=1")}`,
  ],
  ["Error probe", `/api/profile?userId=${enc("1'")}`, `/api/users/${enc("1'")}`],
];

(async () => {
  const server = createDemoServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log("Caller: Mirza Yasir Abdullah Baig (user id 1, role user, token-yasir)\n");
  for (const [label, vulnPath, fixedPath] of ATTACKS) {
    for (const [side, p] of [
      ["vulnerable", `/vuln${vulnPath}`],
      ["fixed", `/fixed${fixedPath}`],
    ]) {
      const res = await fetch(base + p, { headers: { Authorization: `Bearer ${T}` } });
      const body = await res.text();
      console.log(
        `[${side}] ${label}\n  GET ${p.replace(/^\/(vuln|fixed)/, "")}\n  -> HTTP ${res.status}\n  ${body}\n`,
      );
    }
  }
  server.close();
})();
