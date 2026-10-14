/** @jest-environment node */
const fs = require("node:fs");
const path = require("node:path");
const { validateCooInputs } = require("../src/validateCooInputs");

const load = (f) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "inputs", f), "utf8"));
const complete = load("coo_inputs.demo-complete.json");
const mutate = (fn) => {
  const copy = structuredClone(complete);
  fn(copy);
  return copy;
};
const codes = (input) => validateCooInputs(input).errors.map((e) => e.code);

describe("Day 16: AI-COO minimum operating inputs", () => {
  test("a complete set is valid and all 14 checks pass", () => {
    const r = validateCooInputs(complete);
    expect(r.valid).toBe(true);
    expect(r.checks).toHaveLength(14);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });

  test("this repo's real inputs file is valid except for the not-yet-named human reviewer", () => {
    const allowed = new Set(["REVIEWER", "SEPARATION"]);
    expect(codes(load("coo_inputs.json")).every((c) => allowed.has(c))).toBe(true);
  });

  test.each([
    ["missing objective", (i) => (i.objective = ""), "OBJECTIVE"],
    [
      "objective not approved by a human",
      (i) => delete i.objectiveApprovedBy,
      "OBJECTIVE_APPROVED",
    ],
    ["owner is an agent", (i) => (i.humanOwner = "Task Agent 7"), "OWNER"],
    ["reviewer missing", (i) => (i.humanReviewer = null), "REVIEWER"],
    ["reviewer is an AI", (i) => (i.humanReviewer = "Claude"), "REVIEWER"],
    [
      "reviewer is the owner (self-review)",
      (i) => (i.humanReviewer = "Mirza Yasir Abdullah Baig"),
      "SEPARATION",
    ],
    [
      "wildcard repository",
      (i) => (i.repositories = ["mirzayasirabdullahbaig07/*"]),
      "REPOS",
    ],
    ["no repositories", (i) => (i.repositories = []), "REPOS"],
    ["no allowed environments", (i) => (i.environment.allowed = []), "ENV_ALLOWED"],
    [
      "production not forbidden",
      (i) => (i.environment.forbidden = ["secrets and credentials"]),
      "ENV_FORBIDDEN",
    ],
    [
      "secrets not forbidden",
      (i) => (i.environment.forbidden = ["production"]),
      "ENV_FORBIDDEN",
    ],
    [
      "only 2 acceptance criteria",
      (i) => (i.acceptanceCriteria = i.acceptanceCriteria.slice(0, 2)),
      "ACCEPTANCE",
    ],
    ["no non-goals", (i) => (i.nonGoals = []), "NON_GOALS"],
    ["permissions missing", (i) => delete i.permissions, "PERMS_DEFINED"],
    [
      "invalid write level",
      (i) => (i.permissions["task-agent"].write = "yes"),
      "PERMS_DEFINED",
    ],
    [
      "task agent may merge",
      (i) => (i.permissions["task-agent"].merge = true),
      "NO_AGENT_MERGE",
    ],
    ["AI-COO may merge", (i) => (i.permissions["ai-coo"].merge = true), "NO_AGENT_MERGE"],
    [
      "task agent may write to any branch",
      (i) => (i.permissions["task-agent"].write = "any"),
      "LEAST_PRIVILEGE",
    ],
    [
      "review agent may write",
      (i) => (i.permissions["review-agent"].write = "own-branch"),
      "REVIEW_READ_ONLY",
    ],
  ])("rejects: %s", (_label, change, expectedCode) => {
    const r = validateCooInputs(mutate(change));
    expect(r.valid).toBe(false);
    expect(r.errors.map((e) => e.code)).toContain(expectedCode);
  });

  test("garbage input never throws", () => {
    for (const bad of [null, undefined, 42, "text", [], {}]) {
      expect(() => validateCooInputs(bad)).not.toThrow();
      expect(validateCooInputs(bad).valid).toBe(false);
    }
  });

  test("an empty object fails every check", () => {
    expect(validateCooInputs({}).errors).toHaveLength(14);
  });
});
