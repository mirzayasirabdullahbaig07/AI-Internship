/**
 * Day 18 - repository safety audit for agent work: secret scanning, branch protection, audit logs,
 * and "never give production credentials to an agent environment".
 * Statuses: PASS | FAIL | WARN | MANUAL. MANUAL = a GitHub setting that cannot be verified from a local clone;
 * it is reported honestly as "not verified", never as a pass.
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { scanText } = require("./secretScanner");

const git = (root, args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const SKIP = /(\.(png|jpe?g|gif|webp|pdf|zip|ico|woff2?)$|package-lock\.json$)/i;
const SENSITIVE_ENV = /(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i;
const REQUIRED_IGNORES = [".env", "node_modules", "*.pem", "*.key"];

function trackedFiles(root) {
  return git(root, ["ls-files"]).split("\n").filter(Boolean);
}

function checkSecrets(root) {
  const findings = [];
  let suppressed = 0;
  let scanned = 0;
  for (const file of trackedFiles(root)) {
    if (SKIP.test(file)) continue;
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    scanned++;
    const result = scanText(fs.readFileSync(full, "utf8"), { file });
    findings.push(...result.findings);
    suppressed += result.suppressed.length;
  }
  return {
    id: "secrets",
    title: "No secrets in tracked files",
    status: findings.length === 0 ? "PASS" : "FAIL",
    detail:
      findings.length === 0
        ? `${scanned} files scanned, 0 findings (${suppressed} fake/placeholder values suppressed)`
        : `${findings.length} finding(s): ${findings.map((f) => `${f.file}:${f.line} ${f.rule}`).join("; ")}`,
    findings,
  };
}

function checkIgnore(root) {
  const file = path.join(root, ".gitignore");
  const lines = fs.existsSync(file)
    ? fs
        .readFileSync(file, "utf8")
        .split("\n")
        .map((l) => l.trim().replace(/\/$/, ""))
    : [];
  const missing = REQUIRED_IGNORES.filter((p) => !lines.includes(p));
  return {
    id: "gitignore",
    title: ".gitignore blocks .env, key files and node_modules",
    status: missing.length === 0 ? "PASS" : "FAIL",
    detail:
      missing.length === 0
        ? "all required patterns present"
        : `missing: ${missing.join(", ")}`,
  };
}

function checkEnvFiles(root) {
  const bad = trackedFiles(root).filter(
    (f) => /(^|\/)\.env(\.|$)/.test(f) && !/\.(example|sample|template)$/.test(f),
  );
  return {
    id: "env-files",
    title: "No .env files are tracked",
    status: bad.length === 0 ? "PASS" : "FAIL",
    detail: bad.length === 0 ? "none tracked" : `tracked: ${bad.join(", ")}`,
  };
}

function checkCodeowners(root) {
  const ok = ["CODEOWNERS", ".github/CODEOWNERS", "docs/CODEOWNERS"].some((p) =>
    fs.existsSync(path.join(root, p)),
  );
  return {
    id: "codeowners",
    title: "CODEOWNERS file exists (review ownership)",
    status: ok ? "PASS" : "FAIL",
    detail: ok
      ? "found"
      : "add .github/CODEOWNERS so reviews are requested automatically",
  };
}

function checkPrTemplate(root) {
  const ok = fs.existsSync(path.join(root, ".github", "pull_request_template.md"));
  return {
    id: "pr-template",
    title: "Pull request template exists (Week 2 format)",
    status: ok ? "PASS" : "FAIL",
    detail: ok ? "found" : "missing .github/pull_request_template.md",
  };
}

function checkHistory(root) {
  let rows;
  try {
    rows = git(root, ["log", "--format=%H|%an|%ae|%s"]).split("\n").filter(Boolean);
  } catch {
    rows = [];
  }
  const anonymous = rows.filter((r) => {
    const [, name, email] = r.split("|");
    return !name || !email;
  });
  return {
    id: "audit-log",
    title: "Git history is an attributable audit trail",
    status: rows.length > 0 && anonymous.length === 0 ? "PASS" : "FAIL",
    detail:
      rows.length === 0
        ? "no commits"
        : `${rows.length} commits, ${anonymous.length} without author name/email`,
  };
}

function checkHook(root) {
  const hook = path.join(root, ".git", "hooks", "pre-commit");
  const ok =
    fs.existsSync(hook) &&
    fs.readFileSync(hook, "utf8").includes("day-18-working-safely");
  return {
    id: "pre-commit",
    title: "Local pre-commit secret scan is installed",
    status: ok ? "PASS" : "WARN",
    detail: ok
      ? "hook installed"
      : "not installed in this clone: run `npm run hooks:install` (hooks are not part of a git clone)",
  };
}

function checkEnvironment(env = process.env) {
  const names = Object.keys(env).filter((k) => SENSITIVE_ENV.test(k));
  return {
    id: "env-credentials",
    title: "No production credentials in the agent environment",
    status: names.length === 0 ? "PASS" : "WARN",
    detail:
      names.length === 0
        ? "no sensitive-looking environment variable names (names only were checked; values are never read)"
        : `${names.length} sensitive-looking variable name(s) are visible to processes here. Confirm none are production credentials`,
  };
}

const MANUAL = [
  {
    id: "branch-protection",
    title:
      "Branch protection on main (PR required, 1+ approval, status check, no force-push)",
    detail:
      "GitHub setting - cannot be verified from a local clone. Owner must enable it: see REPO_SAFETY.md",
  },
  {
    id: "secret-scanning",
    title: "GitHub secret scanning and push protection enabled",
    detail:
      "GitHub setting - cannot be verified locally. Owner must enable it: see REPO_SAFETY.md",
  },
  {
    id: "agent-token",
    title:
      "Agent tokens are least-privilege (fine-grained, this repo only, no admin, no merge)",
    detail: "Depends on how the agent is connected - verify in GitHub token settings",
  },
  {
    id: "github-audit-log",
    title: "GitHub audit log is reviewed",
    detail:
      "Needs an organisation or account audit log; git history above is only the local proxy",
  },
].map((m) => ({ ...m, status: "MANUAL" }));

function runSafetyAudit(root, env = process.env) {
  const checks = [
    checkSecrets(root),
    checkIgnore(root),
    checkEnvFiles(root),
    checkCodeowners(root),
    checkPrTemplate(root),
    checkHistory(root),
    checkHook(root),
    checkEnvironment(env),
    ...MANUAL,
  ];
  const count = (s) => checks.filter((c) => c.status === s).length;
  return {
    checks,
    summary: {
      PASS: count("PASS"),
      FAIL: count("FAIL"),
      WARN: count("WARN"),
      MANUAL: count("MANUAL"),
    },
    ok: count("FAIL") === 0,
  };
}

module.exports = {
  runSafetyAudit,
  checkSecrets,
  checkIgnore,
  checkEnvFiles,
  checkCodeowners,
  checkPrTemplate,
  checkHistory,
  checkHook,
  checkEnvironment,
  trackedFiles,
};
