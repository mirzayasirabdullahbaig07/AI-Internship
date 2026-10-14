/** Day 20 - pure helpers for the internship dashboard (no I/O, so they can be tested). */

const dayOf = (file) => {
  const m = /day-(\d\d)-/.exec(file);
  return m ? m[1] : null;
};

/** Sums Jest's --json output per day folder. Suites outside a day folder are reported separately. */
function summarizeJest(json) {
  const byDay = {};
  const other = { passed: 0, failed: 0, suites: 0 };
  for (const suite of json.testResults ?? []) {
    const day = dayOf(suite.name.replace(/\\/g, "/"));
    const bucket = day ? (byDay[day] ??= { passed: 0, failed: 0, suites: 0 }) : other;
    bucket.suites += 1;
    for (const t of suite.assertionResults ?? []) {
      if (t.status === "passed") bucket.passed += 1;
      else if (t.status === "failed") bucket.failed += 1;
    }
  }
  const all = [...Object.values(byDay), other];
  return {
    byDay,
    other,
    totals: {
      passed: all.reduce((n, b) => n + b.passed, 0),
      failed: all.reduce((n, b) => n + b.failed, 0),
      suites: all.reduce((n, b) => n + b.suites, 0),
    },
  };
}

/** Counts commits whose Conventional Commit scope is "(day-NN)". */
function commitsByDay(subjects) {
  const counts = {};
  for (const s of subjects) {
    const m = /\(day-(\d\d)\)/.exec(s);
    if (m) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
  }
  return counts;
}

const DAYS = [
  [
    "01",
    "Software delivery basics: static profile card",
    "Playwright: overflow + hover checks",
  ],
  ["02", "Responsive sign-in form (CSS Grid)", "Playwright: 4 widths, Tab order, Enter"],
  ["03", "Typed task list, four UI states", "-"],
  ["04", "API consumption with retry", "-"],
  ["05", "Password strength meter + critical review", "-"],
  ["06", "Local Git discipline", "real one-file, one-commit lab"],
  ["07", "GitHub and Draft PR", "PR text only"],
  ["08", "PR review discipline", "failing test, then fix"],
  ["09", "Local-first CI test matrix", "docs + verify run"],
  ["10", "CI failures and honest reporting", "5 classified sample logs"],
  ["11", "Task agent: LoginForm email validation", "-"],
  ["12", "Review agent: audit an unsafe PR", "Playwright demo, 6 exploits proven"],
  ["13", "Keeping token use low", "browser counts match Node"],
  ["14", "Tests that matter", "keyboard journey + 6-bug mutation check"],
  ["15", "Security and privacy (OWASP 2025)", "5 attacks vs 2 APIs, npm audit"],
  ["16", "AI-COO operating inputs", "validator demo, 4 presets"],
  ["17", "AI-COO task lifecycle", "illegal-move demo"],
  ["18", "Working safely with agents", "repo audit, secret scanner, handoff"],
  ["19", "Capstone: Leave Request form", "keyboard flow, axe 7 states, 12 mutants"],
  ["20", "Demo, review and retrospective", "this dashboard, 2 review bugs fixed"],
].map(([day, topic, evidence]) => ({ day, topic, evidence }));

module.exports = { dayOf, summarizeJest, commitsByDay, DAYS };
