/** @jest-environment node */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runSafetyAudit, checkEnvironment } = require("../src/repoSafety");
const { scanStaged } = require("../src/hook");

const GOOD_IGNORE = "node_modules/\n.env\n.env.*\n*.pem\n*.key\n";
const FAKE_AWS = "AKIA" + "QWERTYUIOPASDFGH";
let dirs = [];

function repo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "safety-"));
  dirs.push(dir);
  const git = (...a) =>
    execFileSync(
      "git",
      ["-c", "user.name=Test User", "-c", "user.email=test@example.test", ...a],
      { cwd: dir, stdio: "pipe" },
    );
  git("init", "-q");
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), content);
  }
  git("add", "-A", "-f"); // -f: also track files the fixture .gitignore ignores (e.g. .env)
  git("commit", "-q", "-m", "init");
  return { dir, git };
}
afterAll(() => dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));
const status = (result, id) => result.checks.find((c) => c.id === id).status;
const cleanFiles = {
  ".gitignore": GOOD_IGNORE,
  ".github/CODEOWNERS": "* @owner\n",
  ".github/pull_request_template.md": "## Problem solved\n",
  "README.md": "hello\n",
};

describe("Day 18: repository safety audit", () => {
  test("a clean repo passes every locally verifiable check; GitHub settings stay MANUAL", () => {
    const r = runSafetyAudit(repo(cleanFiles).dir, {});
    expect(r.ok).toBe(true);
    for (const id of [
      "secrets",
      "gitignore",
      "env-files",
      "codeowners",
      "pr-template",
      "audit-log",
      "env-credentials",
    ])
      expect(status(r, id)).toBe("PASS");
    expect(status(r, "branch-protection")).toBe("MANUAL");
    expect(status(r, "secret-scanning")).toBe("MANUAL");
    expect(r.summary.MANUAL).toBe(4);
  });

  test("a committed secret fails the audit and the report never shows the secret", () => {
    const r = runSafetyAudit(
      repo({ ...cleanFiles, "src/config.js": `export const key = "${FAKE_AWS}";\n` }).dir,
      {},
    );
    expect(r.ok).toBe(false);
    expect(status(r, "secrets")).toBe("FAIL");
    expect(JSON.stringify(r)).not.toContain(FAKE_AWS);
    expect(r.checks.find((c) => c.id === "secrets").detail).toMatch(
      /src\/config\.js:1 aws-access-key/,
    );
  });

  test("a tracked .env file fails", () => {
    expect(
      status(
        runSafetyAudit(repo({ ...cleanFiles, ".env": "A=1\n" }).dir, {}),
        "env-files",
      ),
    ).toBe("FAIL");
  });

  test("a tracked .env.example is allowed", () => {
    expect(
      status(
        runSafetyAudit(repo({ ...cleanFiles, ".env.example": "A=\n" }).dir, {}),
        "env-files",
      ),
    ).toBe("PASS");
  });

  test("a .gitignore without .env / key patterns fails and lists what is missing", () => {
    const r = runSafetyAudit(
      repo({ ...cleanFiles, ".gitignore": "node_modules/\n" }).dir,
      {},
    );
    expect(status(r, "gitignore")).toBe("FAIL");
    expect(r.checks.find((c) => c.id === "gitignore").detail).toMatch(
      /\.env.*\*\.pem|\.env, \*\.pem, \*\.key/,
    );
  });

  test("missing CODEOWNERS and PR template fail", () => {
    const {
      ".github/CODEOWNERS": _a,
      ".github/pull_request_template.md": _b,
      ...rest
    } = cleanFiles;
    const r = runSafetyAudit(repo(rest).dir, {});
    expect(status(r, "codeowners")).toBe("FAIL");
    expect(status(r, "pr-template")).toBe("FAIL");
  });

  test("sensitive-looking environment variable NAMES warn; values are never read", () => {
    const env = {
      PATH: "/usr/bin",
      PROD_DB_PASSWORD: "hunter2-value",
      GITHUB_TOKEN: "x",
    };
    const result = checkEnvironment(env);
    expect(result.status).toBe("WARN");
    expect(JSON.stringify(result)).not.toContain("hunter2-value");
    expect(checkEnvironment({ PATH: "/usr/bin", HOME: "/root" }).status).toBe("PASS");
  });

  test("the pre-commit hook blocks a staged secret and allows clean changes", () => {
    const { dir, git } = repo(cleanFiles);
    fs.writeFileSync(path.join(dir, "ok.txt"), "nothing secret\n");
    git("add", "ok.txt");
    expect(scanStaged(dir)).toEqual([]);
    fs.writeFileSync(path.join(dir, "bad.js"), `const k = "${FAKE_AWS}";\n`);
    git("add", "bad.js");
    const findings = scanStaged(dir);
    expect(findings.map((f) => f.rule)).toEqual(["aws-access-key"]);
    expect(JSON.stringify(findings)).not.toContain(FAKE_AWS);
  });

  test("the hook scans what is STAGED, not the working tree", () => {
    const { dir, git } = repo(cleanFiles);
    fs.writeFileSync(path.join(dir, "a.js"), "const safe = 1;\n");
    git("add", "a.js");
    fs.writeFileSync(path.join(dir, "a.js"), `const k = "${FAKE_AWS}";\n`); // unstaged edit
    expect(scanStaged(dir)).toEqual([]);
  });
});
