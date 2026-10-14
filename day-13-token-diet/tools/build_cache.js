// Builds ARCHITECTURE_CACHE.md: findings an AI would otherwise "rediscover" on every prompt.
// Run from the repo root: node day-13-token-diet/tools/build_cache.js
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { estimateTokens } = require("../src/promptMetrics");

const root = path.resolve(__dirname, "..", "..");
const files = execSync("git ls-files", { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const SRC = /\.(ts|tsx|js|mjs|html|css|md|json|py|yml)$/;
const SKIP =
  /(package-lock\.json|\/evidence\/|^report\/|\/report\/|\.diff$|day-13-token-diet\/)/;
const source = files.filter((f) => SRC.test(f) && !SKIP.test(f));
const wholeRepoTokens = source.reduce(
  (n, f) => n + estimateTokens(fs.readFileSync(path.join(root, f), "utf8")),
  0,
);

const days = fs
  .readdirSync(root)
  .filter((d) => /^day-\d\d-/.test(d))
  .sort();
const firstLine = (d) => {
  const p = path.join(root, d, "README.md");
  return fs.existsSync(p)
    ? (fs
        .readFileSync(p, "utf8")
        .split("\n")
        .find((l) => l.startsWith("#"))
        ?.replace(/^#+\s*/, "") ?? "")
    : "";
};
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const md = `# Architecture cache (generated - do not hand-edit)

Paste THIS into a prompt instead of letting the AI re-read the repository.

- Owner: Mirza Yasir Abdullah Baig (mirzayasirabdullahbaig07). Repo: AI-Internship.
- Stack: TypeScript + React (components), Node 22 (APIs, node:sqlite), Jest + Testing Library, Playwright (browser), Prettier.
- Verify everything locally: \`npm run verify\` = prettier --check, tsc --noEmit, jest.
- Conventions: one branch per task, Conventional Commits, no self-merge, fake data only, AI output untrusted.
- Server is the authority (auth, calculation, validation); the client is UX only.

## Folders
${days.map((d) => `- \`${d}/\` - ${firstLine(d)}`).join("\n")}

## Scripts
${Object.entries(pkg.scripts)
  .map(([k, v]) => `- \`npm run ${k}\` -> ${v}`)
  .join("\n")}
`;
fs.writeFileSync(path.join(__dirname, "..", "outputs", "ARCHITECTURE_CACHE.md"), md);
const cacheTokens = estimateTokens(md);
const line = `whole-repo source (${source.length} files): ~${wholeRepoTokens} est. tokens | cache: ~${cacheTokens} est. tokens | saved: ${(100 - (cacheTokens / wholeRepoTokens) * 100).toFixed(1)}%`;
fs.writeFileSync(
  path.join(__dirname, "..", "evidence", "cache_metrics.txt"),
  line + "\n",
);
console.log(line);
