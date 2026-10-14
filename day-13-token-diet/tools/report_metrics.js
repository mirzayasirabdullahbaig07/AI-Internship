// node day-13-token-diet/tools/report_metrics.js  -> prints and saves before/after numbers
const fs = require("node:fs");
const path = require("node:path");
const {
  countWords,
  estimateTokens,
  checkCriteria,
  findNoise,
} = require("../src/promptMetrics");
const { criteria, noise } = require("../src/criteria.json");

const dir = path.join(__dirname, "..");
const verbose = fs.readFileSync(path.join(dir, "inputs/verbose_prompt.txt"), "utf8");
const brief = fs.readFileSync(path.join(dir, "outputs/task_brief_150.txt"), "utf8");
const vw = countWords(verbose),
  bw = countWords(brief),
  vt = estimateTokens(verbose),
  bt = estimateTokens(brief);
const kept = checkCriteria(brief, criteria, "brief").filter((c) => c.present).length;
const lines = [
  `Verbose prompt : ${vw} words, ${verbose.length} chars, ~${vt} est. tokens, ${findNoise(verbose, noise).length}/${noise.length} noise markers`,
  `Task brief     : ${bw} words, ${brief.length} chars, ~${bt} est. tokens, ${findNoise(brief, noise).length}/${noise.length} noise markers`,
  `Reduction      : words -${(100 - (bw / vw) * 100).toFixed(1)}%, est. tokens -${(100 - (bt / vt) * 100).toFixed(1)}%`,
  `Criteria kept  : ${kept}/${criteria.length}`,
  `(Token numbers are a chars/4 ESTIMATE, not a real tokenizer.)`,
];
fs.writeFileSync(path.join(dir, "evidence", "metrics.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
