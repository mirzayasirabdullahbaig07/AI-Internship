// node day-20-demo-retrospective/tools/build_dashboard.js
// Builds demo/dashboard.html from REAL data: a Jest --json run, git history and the files on disk.
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { summarizeJest, commitsByDay, DAYS } = require("../src/dashboard");

const root = path.resolve(__dirname, "..", "..");
const jsonFile = path.join(require("node:os").tmpdir(), "jest-dashboard.json");
spawnSync("npx", ["jest", "--json", `--outputFile=${jsonFile}`], {
  cwd: root,
  encoding: "utf8",
});
const jest = summarizeJest(JSON.parse(fs.readFileSync(jsonFile, "utf8")));
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" }).trim();
const subjects = git("log", "--format=%s").split("\n");
const commits = commitsByDay(subjects);
const totalCommits = Number(git("rev-list", "--count", "HEAD"));
const branches = git("branch", "--format=%(refname:short)")
  .split("\n")
  .filter(Boolean).length;
const sha = git("rev-parse", "--short", "HEAD");

const dayDir = (n) => fs.readdirSync(root).find((d) => d.startsWith(`day-${n}-`));
const shots = (n) => {
  let count = 0;
  const dir = dayDir(n);
  const evidence = dir && path.join(root, dir, "evidence", "screenshots");
  if (evidence && fs.existsSync(evidence))
    count += fs.readdirSync(evidence).filter((f) => f.endsWith(".png")).length;
  const legacy = path.join(root, "report", "screenshots");
  if ((n === "01" || n === "02") && fs.existsSync(legacy))
    count += fs.readdirSync(legacy).filter((f) => f.startsWith(`day${n}`)).length;
  return count;
};

const rows = DAYS.map((d) => ({
  ...d,
  tests: jest.byDay[d.day]?.passed ?? 0,
  failed: jest.byDay[d.day]?.failed ?? 0,
  commits: commits[d.day] ?? 0,
  shots: shots(d.day),
}));
const data = {
  sha,
  totals: jest.totals,
  other: jest.other,
  totalCommits,
  branches,
  rows,
  generated: "from a real jest --json run, git log and the file tree",
};
fs.writeFileSync(
  path.join(__dirname, "..", "evidence", "dashboard_data.json"),
  JSON.stringify(data, null, 2),
);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI-Assisted Software Development Internship - dashboard</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#f1f3f9;color:#1b2240;font-family:system-ui,"Segoe UI",Roboto,sans-serif}
h1{margin:0 0 4px;font-size:1.5rem}.sub{margin:0 0 16px;color:#4a5270}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;max-width:1240px;margin-bottom:16px}
.tile{background:#fff;border-radius:12px;padding:12px 16px;box-shadow:0 4px 16px rgb(27 34 64/10%)}.tile b{display:block;font-size:1.6rem}.tile span{color:#4a5270;font-size:.82rem}
.tile.warn b{color:#9b1c1c}
table{border-collapse:collapse;width:100%;max-width:1240px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgb(27 34 64/10%);font-size:.88rem}
th,td{padding:7px 12px;text-align:left;border-top:1px solid #eef0f8}th{background:#1f2d6b;color:#fff;border:0}td.n{text-align:right;font-variant-numeric:tabular-nums}
.ok{color:#14633a;font-weight:700}.fail{color:#9b1c1c;font-weight:800}.dim{color:#8a90a8}
.note{max-width:1240px;margin-top:14px;padding:12px 16px;background:#fff7e6;border:1px solid #f0c36d;border-radius:10px;font-size:.88rem}
</style></head><body>
<h1>AI-Assisted Software Development Internship - Days 1-20</h1>
<p class="sub">Mirza Yasir Abdullah Baig, AI Engineer - github.com/mirzayasirabdullahbaig07/AI-Internship - numbers come from a real run on commit ${esc(sha)}</p>
<div class="tiles">
 <div class="tile"><b>${jest.totals.passed}</b><span>tests passing</span></div>
 <div class="tile"><b class="${jest.totals.failed ? "fail" : ""}">${jest.totals.failed}</b><span>tests failing</span></div>
 <div class="tile"><b>${jest.totals.suites}</b><span>test suites</span></div>
 <div class="tile"><b>${totalCommits}</b><span>commits on main</span></div>
 <div class="tile"><b>${branches}</b><span>day branches</span></div>
 <div class="tile warn"><b>0</b><span>pull requests opened</span></div>
 <div class="tile warn"><b>0</b><span>hosted CI runs</span></div>
</div>
<table><tr><th>Day</th><th>Topic</th><th class="n">Tests</th><th class="n">Commits</th><th class="n">Screenshots</th><th>Other evidence</th></tr>
${rows.map((r) => `<tr><td>${r.day}</td><td>${esc(r.topic)}</td><td class="n">${r.failed ? `<span class="fail">${r.tests}/${r.tests + r.failed}</span>` : r.tests ? `<span class="ok">${r.tests}</span>` : '<span class="dim">-</span>'}</td><td class="n">${r.commits || '<span class="dim">-</span>'}</td><td class="n">${r.shots || '<span class="dim">-</span>'}</td><td>${esc(r.evidence)}</td></tr>`).join("\n")}
</table>
<div class="note"><b>Honest status:</b> no pull request has been opened and hosted CI has not been run (both need the owner's GitHub account); no human reviewer is named yet; GitHub branch protection and secret scanning must be enabled by the owner. A dash means that day has no automated test or screenshot, not that evidence is hidden. Days 1-10 pre-date the "(day-NN)" commit-scope convention for some commits.</div>
<script>document.body.dataset.ready="true"</script></body></html>`;
fs.writeFileSync(path.join(__dirname, "..", "demo", "dashboard.html"), html);
// Generated files must satisfy `npm run verify` (prettier --check), so format them as part of the build.
spawnSync(
  "npx",
  [
    "prettier",
    "--write",
    path.join(__dirname, "..", "demo", "dashboard.html"),
    path.join(__dirname, "..", "evidence", "dashboard_data.json"),
  ],
  { cwd: root },
);
console.log(
  `dashboard built: ${jest.totals.passed} passing, ${jest.totals.failed} failing, ${jest.totals.suites} suites, ${totalCommits} commits, ${branches} branches, sha ${sha}`,
);
