/** @jest-environment node */
const { buildHandoff, validateHandoff, NOT_OPENED } = require("../src/handoff");

const base = {
  prLink: "https://github.com/mirzayasirabdullahbaig07/AI-Internship/pull/1",
  finalSha: "7fa7a1c",
  objective:
    "Ship the Week 3 deliverables (task agent, review agent, token diet, tests, security, AI-COO) locally tested.",
  evidence: [
    { command: "npm run verify", result: "exit 0, 14 suites, 150 tests passed" },
  ],
  blockers: ["Hosted CI has not been run."],
};
const codes = (md) => validateHandoff(md).errors.map((e) => e.code);

describe("Day 18: safe handoff report", () => {
  test("a built handoff contains ONLY the five required sections and validates", () => {
    const md = buildHandoff(base);
    expect(validateHandoff(md)).toEqual({ valid: true, errors: [] });
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual([
      "PR link",
      "Final SHA",
      "Scoped objective",
      "Test evidence",
      "Remaining blockers",
    ]);
  });

  test("an unopened PR is stated honestly and becomes a blocker automatically", () => {
    const md = buildHandoff({ ...base, prLink: "", blockers: [] });
    expect(md).toContain(NOT_OPENED);
    expect(md).toMatch(/pull request has not been opened/i);
    expect(validateHandoff(md).valid).toBe(true);
  });

  test("no blockers is written as 'none'", () => {
    expect(buildHandoff({ ...base, blockers: [] })).toMatch(/- none/);
  });

  describe("rejects what a handoff must never contain", () => {
    const good = buildHandoff(base);
    test.each([
      ["a fenced code block", good + "\n```js\nconst x = 1;\n```\n", "RAW_CODE"],
      ["an indented code block", good + "\n    return secretValue;\n", "RAW_CODE"],
      ["source code keywords", good.replace("exit 0", "const ok = true"), "RAW_CODE"],
      [
        "a pasted stack trace",
        good + "\nError: boom\n    at run (/app/src/x.js:10:5)\n",
        "RAW_CODE",
      ],
      ["HTML markup", good + "\n<script>alert(1)</script>\n", "RAW_CODE"],
      ["an AWS key", good + "\n- key: " + "AKIA" + "QWERTYUIOPASDFGH\n", "SECRET"],
      [
        "a GitHub token",
        good + "\n- t: ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8\n",
        "SECRET",
      ],
      ["an extra section", good + "\n## Implementation notes\nstuff\n", "SECTIONS"],
      ["a missing section", good.replace(/## Remaining blockers[\s\S]*/, ""), "SECTIONS"],
      [
        "sections in the wrong order",
        good
          .replace("## PR link", "## Final SHA")
          .replace("## Final SHA\n7fa7a1c", "## PR link\n7fa7a1c"),
        "SECTIONS",
      ],
      [
        "a non-https PR link",
        buildHandoff({ ...base, prLink: "http://insecure.example/pr/1" }),
        "PR_LINK",
      ],
      ["a bad SHA", buildHandoff({ ...base, finalSha: "latest" }), "SHA"],
      ["a short objective", buildHandoff({ ...base, objective: "done" }), "OBJECTIVE"],
      ["no test evidence", buildHandoff({ ...base, evidence: [] }), "EVIDENCE"],
    ])("%s", (_label, md, expected) => {
      expect(codes(md)).toContain(expected);
    });

    test("an unopened PR without a PR blocker is rejected", () => {
      const md =
        "# Handoff report\n\n## PR link\nNOT OPENED\n\n## Final SHA\n7fa7a1c\n\n## Scoped objective\nShip the Week 3 deliverables locally tested.\n\n## Test evidence\n- npm run verify -> exit 0\n\n## Remaining blockers\n- Hosted CI not run.\n";
      expect(codes(md)).toContain("PR_BLOCKER");
    });
  });

  test("a secret reported by the validator is redacted in the error message", () => {
    const secret = "ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8";
    const { errors } = validateHandoff(buildHandoff(base) + `\n- ${secret}\n`);
    expect(JSON.stringify(errors)).not.toContain(secret);
  });

  test("garbage input never throws", () => {
    for (const bad of [null, undefined, 5, "", "random text"])
      expect(() => validateHandoff(bad)).not.toThrow();
  });
});
