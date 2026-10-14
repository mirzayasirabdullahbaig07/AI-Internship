// Pre-commit hook logic: scan what is STAGED (not the working tree) and block the commit on a finding.
const { execFileSync } = require("node:child_process");
const { scanText } = require("./secretScanner");

function scanStaged(root) {
  const names = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);
  const findings = [];
  for (const file of names) {
    if (/\.(png|jpe?g|gif|webp|pdf|zip|ico|woff2?)$|package-lock\.json$/i.test(file))
      continue;
    const staged = execFileSync("git", ["show", `:${file}`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    findings.push(...scanText(staged, { file }).findings);
  }
  return findings;
}

if (require.main === module) {
  const findings = scanStaged(process.cwd());
  if (findings.length) {
    console.error(
      "Commit blocked: possible secret(s) in staged changes (values are not shown):",
    );
    for (const f of findings)
      console.error(`  ${f.file}:${f.line}  ${f.rule}  ${f.preview}`);
    console.error(
      "Remove the secret (and rotate it if it was ever real), then commit again.",
    );
    process.exit(1);
  }
}

module.exports = { scanStaged };
