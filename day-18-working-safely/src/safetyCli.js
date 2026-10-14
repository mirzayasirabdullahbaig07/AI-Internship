// node day-18-working-safely/src/safetyCli.js [--json out.json]   exit code 1 if any check FAILS
const fs = require("node:fs");
const path = require("node:path");
const { runSafetyAudit } = require("./repoSafety");

const root = path.resolve(__dirname, "..", "..");
const result = runSafetyAudit(root);
for (const c of result.checks)
  console.log(`[${c.status.padEnd(6)}] ${c.title}\n         ${c.detail}`);
const s = result.summary;
console.log(
  `\nSUMMARY: ${s.PASS} pass, ${s.FAIL} fail, ${s.WARN} warn, ${s.MANUAL} manual (not verifiable locally)`,
);
const i = process.argv.indexOf("--json");
if (i !== -1) fs.writeFileSync(process.argv[i + 1], JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
