/** @jest-environment node */
const fs = require("node:fs");
const path = require("node:path");
const {
  countWords,
  estimateTokens,
  checkCriteria,
  findNoise,
} = require("../src/promptMetrics");
const { criteria, noise } = require("../src/criteria.json");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const verbose = read("inputs/verbose_prompt.txt");
const brief = read("outputs/task_brief_150.txt");

describe("Day 13 lab: 1,000-word prompt -> 150-word brief", () => {
  test("the input really is a ~1,000-word, noisy prompt", () => {
    expect(countWords(verbose)).toBeGreaterThanOrEqual(1000);
    expect(findNoise(verbose, noise).length).toBeGreaterThanOrEqual(8); // history, pleas, flattery present
  });

  test("the brief is at most 150 words", () => {
    expect(countWords(brief)).toBeLessThanOrEqual(150);
  });

  test("EVERY core acceptance criterion exists in the original (the checker is not vacuous)", () => {
    const missing = checkCriteria(verbose, criteria, "verbose").filter((c) => !c.present);
    expect(missing).toEqual([]);
  });

  test("EVERY core acceptance criterion survives in the brief", () => {
    const lost = checkCriteria(brief, criteria, "brief").filter((c) => !c.present);
    expect(lost).toEqual([]);
  });

  test("no company history, emotional pleas or flattery leak into the brief", () => {
    expect(findNoise(brief, noise)).toEqual([]);
  });

  test("the brief cuts at least 85% of the words and of the estimated tokens", () => {
    expect(1 - countWords(brief) / countWords(verbose)).toBeGreaterThanOrEqual(0.85);
    expect(1 - estimateTokens(brief) / estimateTokens(verbose)).toBeGreaterThanOrEqual(
      0.85,
    );
  });

  test("the checker detects a lost criterion (negative control)", () => {
    const damaged = brief.replace(/^.*30 days.*\n/m, "");
    const lost = checkCriteria(damaged, criteria, "brief").filter((c) => !c.present);
    expect(lost.map((c) => c.id)).toEqual(["C6"]);
  });

  test("the brief follows the Standard Task Prompt Structure headings", () => {
    for (const h of ["Goal:", "Scope:", "Do not:", "Return:"]) expect(brief).toContain(h);
  });
});
