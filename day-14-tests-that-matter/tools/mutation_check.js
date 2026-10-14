// Plants 6 realistic bugs ("mutants") in a COPY of LoginForm and records which test layers notice.
// node day-14-tests-that-matter/tools/mutation_check.js   (needs Playwright for Python + esbuild)
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { build } = require("esbuild");
const { createServer } = require("./server");

const root = path.resolve(__dirname, "..", "..");
const day = path.join(root, "day-14-tests-that-matter");
const work = path.join(day, ".mutants");
const original = fs.readFileSync(
  path.join(root, "day-11-task-agent", "LoginForm.tsx"),
  "utf8",
);

const MUTANTS = [
  { id: "M0", name: "baseline (original code, no bug)", apply: (s) => s },
  {
    id: "M1",
    name: "validation removed (bad email is submitted)",
    from: "if (!EMAIL_PATTERN.test(email)) {",
    to: "if (false) {",
  },
  {
    id: "M2",
    name: "error text no longer red",
    from: 'style={{ color: "red" }}',
    to: 'style={{ color: "black" }}',
  },
  {
    id: "M3",
    name: "HTTP 401 treated as success (res.ok check removed)",
    from: "if (!res.ok) throw new Error(`HTTP ${res.status}`);",
    to: "",
  },
  {
    id: "M4",
    name: "client sends a user id again (?userId=2)",
    from: "`${apiBase}/api/profile`",
    to: "`${apiBase}/api/profile?userId=2`",
  },
  {
    id: "M5",
    name: "apiBase ignored (wrong URL wiring)",
    from: "`${apiBase}/api/profile`",
    to: "`/api/profile`",
  },
  {
    id: "M6",
    name: "Authorization header not sent",
    from: "headers: { Authorization: `Bearer ${token}` },",
    to: "headers: {},",
  },
];

function mutate(m) {
  if (!m.from) return original;
  if (!original.includes(m.from))
    throw new Error(`mutant ${m.id}: pattern not found - LoginForm.tsx changed`);
  return original.replace(m.from, m.to);
}

function jestPasses(file, componentPath) {
  const r = spawnSync("npx", ["jest", file], {
    cwd: root,
    env: { ...process.env, LOGINFORM_PATH: componentPath },
    encoding: "utf8",
  });
  return r.status === 0;
}

async function browserPasses(id, shots) {
  const entry = path.join(work, `entry_${id}.tsx`);
  fs.writeFileSync(
    entry,
    `import { createRoot } from "react-dom/client";
import LoginForm from "./LoginForm_${id}";
createRoot(document.getElementById("root") as HTMLElement).render(<LoginForm token="token-yasir" apiBase="/fixed" />);
`,
  );
  const bundle = path.join(work, `bundle_${id}.js`);
  await build({
    entryPoints: [entry],
    bundle: true,
    outfile: bundle,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
  const server = createServer(bundle);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const env = { ...process.env, BASE_URL: `http://127.0.0.1:${server.address().port}` };
  if (shots) env.SHOTS = shots;
  const code = await new Promise((resolve) => {
    const c = spawn("python3", [path.join(__dirname, "browser_journey.py")], {
      env,
      stdio: shots ? "inherit" : "ignore",
    });
    c.on("close", resolve);
  });
  server.close();
  return code === 0;
}

(async () => {
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const rows = [];
  for (const m of MUTANTS) {
    const compPath = path.join(work, `LoginForm_${m.id}.tsx`);
    fs.writeFileSync(compPath, mutate(m));
    const weak = jestPasses(
      "day-14-tests-that-matter/tests/weak.antipattern.test.tsx",
      compPath,
    );
    const comp = jestPasses(
      "day-14-tests-that-matter/tests/component.test.tsx",
      compPath,
    );
    const e2e = await browserPasses(
      m.id,
      m.id === "M0" ? path.join(day, "evidence", "screenshots") : null,
    );
    rows.push({ ...m, weak, comp, e2e });
    console.log(`${m.id} done`);
  }
  fs.rmSync(work, { recursive: true, force: true });

  const verdict = (passes, isBaseline) =>
    isBaseline ? (passes ? "pass" : "FAIL (broken test!)") : passes ? "missed" : "CAUGHT";
  const w = [4, 52, 11, 11, 11];
  const line = (cols) => cols.map((c, i) => String(c).padEnd(w[i])).join(" ");
  const out = [
    line(["ID", "Planted bug", "Weak tests", "Component", "Browser"]),
    line(w.map((n) => "-".repeat(n - 1))),
  ];
  for (const r of rows)
    out.push(
      line([
        r.id,
        r.name,
        verdict(r.weak, r.id === "M0"),
        verdict(r.comp, r.id === "M0"),
        verdict(r.e2e, r.id === "M0"),
      ]),
    );
  const bugs = rows.filter((r) => r.id !== "M0");
  const caught = (k) => bugs.filter((r) => !r[k]).length;
  out.push(
    "",
    `Bugs caught (of ${bugs.length}): weak tests ${caught("weak")}, component test ${caught("comp")}, browser journey ${caught("e2e")}, component+browser together ${bugs.filter((r) => !r.comp || !r.e2e).length}`,
  );
  const baselineOk = rows[0].weak && rows[0].comp && rows[0].e2e;
  out.push(
    `Baseline (original code) passes every layer: ${baselineOk ? "yes" : "NO - results invalid"}`,
  );
  fs.writeFileSync(
    path.join(day, "evidence", "mutation_report.txt"),
    out.join("\n") + "\n",
  );
  fs.writeFileSync(
    path.join(day, "evidence", "mutation_report.json"),
    JSON.stringify(
      rows.map(({ apply, from, to, ...r }) => r),
      null,
      2,
    ),
  );
  console.log(out.join("\n"));
  process.exit(baselineOk ? 0 : 1);
})();
