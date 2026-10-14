/**
 * Day 16 - Minimum operating inputs for an AI-COO (handbook):
 *   1. approved feature objective        4. strict acceptance criteria + explicit non-goals
 *   2. named human owner AND reviewer    5. permission bounds (Read / Write / Merge)
 *   3. allowed repositories and environment boundaries
 * Returns every check (pass or fail) so a UI can show the full picture.
 */
const AGENT_LIKE = /\b(agent|bot|ai|gpt|llm|claude|copilot|coo)\b/i;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const WRITE_LEVELS = ["none", "own-branch", "any"];
const isText = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isHumanName = (v) => isText(v, 3) && !AGENT_LIKE.test(v);
const list = (v) => (Array.isArray(v) ? v.filter((x) => isText(x)) : []);

function validateCooInputs(input) {
  const i = input && typeof input === "object" ? input : {};
  const perms = i.permissions && typeof i.permissions === "object" ? i.permissions : {};
  const agents = Object.entries(perms);
  const env = i.environment && typeof i.environment === "object" ? i.environment : {};
  const forbidden = list(env.forbidden).map((s) => s.toLowerCase());
  const repos = list(i.repositories);

  const checks = [
    {
      code: "OBJECTIVE",
      label: "1. Approved objective is stated",
      pass: isText(i.objective, 15),
      message: "objective must be a clear sentence (15+ characters)",
    },
    {
      code: "OBJECTIVE_APPROVED",
      label: "1. Objective is approved by a named human",
      pass: isHumanName(i.objectiveApprovedBy),
      message: "objectiveApprovedBy must be a named human",
    },
    {
      code: "OWNER",
      label: "2. Human owner is named",
      pass: isHumanName(i.humanOwner),
      message: "humanOwner must be a named human (not an agent)",
    },
    {
      code: "REVIEWER",
      label: "2. Human reviewer is named",
      pass: isHumanName(i.humanReviewer),
      message: "humanReviewer must be a named human (not an agent, not empty)",
    },
    {
      code: "SEPARATION",
      label: "2. Reviewer is a different person than the owner",
      pass:
        isHumanName(i.humanOwner) &&
        isHumanName(i.humanReviewer) &&
        i.humanOwner.trim().toLowerCase() !== i.humanReviewer.trim().toLowerCase(),
      message: "owner and reviewer must be different people (never merge your own work)",
    },
    {
      code: "REPOS",
      label: "3. Allowed repositories are listed (owner/name, no wildcards)",
      pass: repos.length > 0 && repos.every((r) => REPO.test(r)),
      message: "repositories must be an explicit list of owner/name",
    },
    {
      code: "ENV_ALLOWED",
      label: "3. Allowed environments are listed",
      pass: list(env.allowed).length > 0,
      message: "environment.allowed must list where agents may run",
    },
    {
      code: "ENV_FORBIDDEN",
      label: "3. Production and secrets are explicitly forbidden",
      pass:
        forbidden.some((f) => f.includes("production")) &&
        forbidden.some((f) => f.includes("secret") || f.includes("credential")),
      message: "environment.forbidden must name production and secrets/credentials",
    },
    {
      code: "ACCEPTANCE",
      label: "4. At least 3 acceptance criteria",
      pass: list(i.acceptanceCriteria).length >= 3,
      message: "list 3+ strict acceptance criteria",
    },
    {
      code: "NON_GOALS",
      label: "4. Explicit non-goals are listed",
      pass: list(i.nonGoals).length >= 1,
      message: "list at least one explicit non-goal",
    },
    {
      code: "PERMS_DEFINED",
      label: "5. Permission bounds are defined for every agent",
      pass:
        agents.length > 0 &&
        agents.every(
          ([, p]) =>
            p &&
            typeof p.read === "boolean" &&
            WRITE_LEVELS.includes(p.write) &&
            typeof p.merge === "boolean",
        ),
      message:
        "each agent needs read (boolean), write (none|own-branch|any), merge (boolean)",
    },
    {
      code: "NO_AGENT_MERGE",
      label: "5. No agent may merge (merge is human-only)",
      pass: agents.length > 0 && agents.every(([, p]) => p && p.merge === false),
      message: "merge must be false for every agent: only a human approves a merge",
    },
    {
      code: "LEAST_PRIVILEGE",
      label: "5. No agent may write to any branch (least privilege)",
      pass: agents.length > 0 && agents.every(([, p]) => p && p.write !== "any"),
      message: "write must be 'none' or 'own-branch', never 'any'",
    },
    {
      code: "REVIEW_READ_ONLY",
      label: "5. A review agent exists and is read-only",
      pass: (() => {
        const reviewers = agents.filter(([name]) => /review/i.test(name));
        return (
          reviewers.length > 0 && reviewers.every(([, p]) => p && p.write === "none")
        );
      })(),
      message:
        "define a review agent (independent review is mandatory) with write: none - it critiques, it does not change code",
    },
  ];
  const errors = checks
    .filter((c) => !c.pass)
    .map(({ code, message }) => ({ code, message }));
  return {
    valid: errors.length === 0,
    errors,
    checks: checks.map(({ code, label, pass }) => ({ code, label, pass })),
  };
}

module.exports = { validateCooInputs };
