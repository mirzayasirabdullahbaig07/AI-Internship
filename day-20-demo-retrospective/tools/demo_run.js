// node day-20-demo-retrospective/tools/demo_run.js  -> runs the capstone's proof steps in order and prints a table
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const steps = [
  [
    "Prettier, TypeScript and every test",
    "npm",
    ["run", "verify"],
    /Tests:\s+(\d+) passed/,
  ],
  [
    "Safety audit (secrets, ignores, CODEOWNERS)",
    "npm",
    ["run", "safety"],
    /SUMMARY: (.+)/,
  ],
  [
    "Build the capstone demo bundle",
    "node",
    ["day-19-capstone-leave-request/tools/build_demo.mjs"],
    /built/,
  ],
  [
    "Keyboard-only browser flow (the ONE flow test)",
    "python3",
    ["day-19-capstone-leave-request/tools/browser_flow.py"],
    /step 6 PASS/,
  ],
  [
    "axe-core on 7 UI states (+ negative control)",
    "python3",
    ["day-19-capstone-leave-request/tools/states_and_a11y.py"],
    /TOTAL violations across 7 states: (\d+)/,
  ],
  [
    "Responsive check 320/390/768/1280px",
    "python3",
    ["day-19-capstone-leave-request/tools/responsive_check.py"],
    /width 1280px.*PASS/,
  ],
];
const rows = [];
let failed = false;
for (const [label, cmd, args, pattern] of steps) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout}\n${r.stderr}`;
  const m = pattern.exec(out);
  const ok = r.status === 0 && Boolean(m);
  failed ||= !ok;
  rows.push(
    `${ok ? "PASS" : "FAIL"}  ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${label}${m && m[1] ? `  [${m[1].trim()}]` : ""}`,
  );
  console.log(rows.at(-1));
}
const sha = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).stdout.trim();
const text = [
  `Demo run on commit ${sha}`,
  ...rows,
  failed ? "RESULT: FAILED" : "RESULT: all steps passed",
  "",
].join("\n");
fs.writeFileSync(path.join(__dirname, "..", "evidence", "demo_run_output.txt"), text);
process.exit(failed ? 1 : 0);
