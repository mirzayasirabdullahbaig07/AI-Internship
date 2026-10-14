// node day-18-working-safely/tools/make_handoff.js [--sha <ref>] [--pr <url>] [--out <file>]
// Verifies an EXACT commit in a clean git worktree (so uncommitted work cannot sneak into the evidence),
// then writes a handoff report that must pass validateHandoff() or the tool exits 1.
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildHandoff, validateHandoff } = require("../src/handoff");
const { runSafetyAudit } = require("../src/repoSafety");

const root = path.resolve(__dirname, "..", "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};
const sha = execFileSync("git", ["rev-parse", arg("--sha", "HEAD")], {
  cwd: root,
  encoding: "utf8",
}).trim();
const short = sha.slice(0, 7);
const out = arg("--out", path.join(__dirname, "..", "outputs", "HANDOFF_DAYS_11-18.md"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-"));
const wt = path.join(tmp, "wt");
try {
  execFileSync("git", ["worktree", "add", "--detach", wt, sha], {
    cwd: root,
    stdio: "pipe",
  });
  fs.symlinkSync(path.join(root, "node_modules"), path.join(wt, "node_modules"));
  const verify = spawnSync("npm", ["run", "verify"], { cwd: wt, encoding: "utf8" });
  const log = `${verify.stdout}\n${verify.stderr}`;
  const suites = /Test Suites:\s+(\d+) passed, (\d+) total/.exec(log);
  const tests = /Tests:\s+(\d+) passed, (\d+) total/.exec(log);
  const verifyResult =
    verify.status === 0 && suites && tests
      ? `exit 0 (Prettier clean, TypeScript clean, ${suites[1]} suites, ${tests[1]} tests passed)`
      : `exit ${verify.status} - FAILED`;
  const audit = runSafetyAudit(wt, {});
  const secrets = audit.checks.find((c) => c.id === "secrets");
  const safetyResult = `${audit.summary.FAIL} failing checks, ${audit.summary.PASS} pass; secret scan: ${secrets.detail.split(",").slice(0, 2).join(",")}; ${audit.summary.MANUAL} GitHub settings not verifiable locally`;

  const handoff = buildHandoff({
    prLink: arg("--pr", ""),
    finalSha: short,
    objective:
      "Deliver Days 11-18 (task agent, review agent, token diet, tests that matter, security and privacy, AI-COO inputs and lifecycle, repository safety) as locally tested work on main. Nothing is deployed.",
    evidence: [
      { command: `npm run verify (on ${short})`, result: verifyResult },
      { command: `npm run safety (on ${short})`, result: safetyResult },
    ],
    blockers: [
      "Hosted CI has not been run on this SHA.",
      "No human reviewer is named yet (day-16-ai-coo/inputs/coo_inputs.json has humanReviewer set to null).",
      "Branch protection and GitHub secret scanning cannot be verified from a local clone; the owner must enable them.",
      "Playwright browser checks were run per day and were not re-run on this SHA.",
      "npm audit reports 19 moderate advisories in dev-only test tooling (0 in runtime); the suggested fix is a breaking downgrade, so it was not applied.",
    ],
  });
  const check = validateHandoff(handoff);
  if (!check.valid) {
    console.error("handoff failed its own validation:", check.errors);
    process.exit(1);
  }
  fs.writeFileSync(out, handoff);
  console.log(handoff);
  if (verify.status !== 0) process.exit(1);
} finally {
  try {
    execFileSync("git", ["worktree", "remove", "--force", wt], {
      cwd: root,
      stdio: "pipe",
    });
  } catch {
    /* already gone */
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
