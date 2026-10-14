/** @jest-environment node */
const { dayOf, summarizeJest, commitsByDay, DAYS } = require("../src/dashboard");

const fixture = {
  testResults: [
    {
      name: "/repo/day-03-typed-tasks/tasks.test.ts",
      assertionResults: [
        { status: "passed" },
        { status: "passed" },
        { status: "failed" },
      ],
    },
    {
      name: "/repo/day-03-typed-tasks/more.test.ts",
      assertionResults: [{ status: "passed" }],
    },
    {
      name: "C:\\repo\\day-19-capstone-leave-request\\tests\\a.test.ts",
      assertionResults: [{ status: "passed" }, { status: "pending" }],
    },
    { name: "/repo/tools/misc.test.js", assertionResults: [{ status: "passed" }] },
  ],
};

describe("Day 20 dashboard helpers", () => {
  test("dayOf reads the day from POSIX and Windows paths", () => {
    expect(dayOf("/r/day-15-security-privacy/x.js")).toBe("15");
    expect(dayOf("day-02-responsive-signin/index.html")).toBe("02");
    expect(dayOf("/r/package.json")).toBeNull();
  });

  test("summarizeJest sums passed/failed/suites per day; skipped tests are not counted as passed", () => {
    const s = summarizeJest(fixture);
    expect(s.byDay["03"]).toEqual({ passed: 3, failed: 1, suites: 2 });
    expect(s.byDay["19"]).toEqual({ passed: 1, failed: 0, suites: 1 });
    expect(s.other).toEqual({ passed: 1, failed: 0, suites: 1 });
    expect(s.totals).toEqual({ passed: 5, failed: 1, suites: 4 });
  });

  test("summarizeJest tolerates empty or malformed input", () => {
    expect(summarizeJest({}).totals).toEqual({ passed: 0, failed: 0, suites: 0 });
  });

  test("commitsByDay counts Conventional Commit scopes only", () => {
    const subjects = [
      "feat(day-19): a",
      "fix(day-19): b",
      "test(day-14): c",
      "docs: no scope",
      "chore: x",
      "feat(api): not a day",
    ];
    expect(commitsByDay(subjects)).toEqual({ 19: 2, 14: 1 });
  });

  test("the dashboard lists every day 01-20 exactly once with a topic and evidence", () => {
    expect(DAYS.map((d) => d.day)).toEqual(
      Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
    for (const d of DAYS) {
      expect(d.topic.length).toBeGreaterThan(5);
      expect(d.evidence.length).toBeGreaterThan(0);
    }
  });
});
