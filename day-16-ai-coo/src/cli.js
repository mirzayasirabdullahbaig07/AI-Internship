// node day-16-ai-coo/src/cli.js <inputs.json>  -> prints every check; exit code 1 if invalid
const fs = require("node:fs");
const { validateCooInputs } = require("./validateCooInputs");

const file = process.argv[2];
if (!file) {
  console.error("usage: node day-16-ai-coo/src/cli.js <inputs.json>");
  process.exit(2);
}
const result = validateCooInputs(JSON.parse(fs.readFileSync(file, "utf8")));
for (const c of result.checks) console.log(`${c.pass ? "[PASS]" : "[FAIL]"} ${c.label}`);
console.log(
  result.valid
    ? "\nRESULT: VALID - the AI-COO may start."
    : `\nRESULT: INVALID - ${result.errors.length} problem(s):`,
);
for (const e of result.errors) console.log(`  - ${e.code}: ${e.message}`);
process.exit(result.valid ? 0 : 1);
