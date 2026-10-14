/**
 * Day 17 - AI-COO task lifecycle (handbook diagram) as a state machine.
 *   [HUMAN] approved objective -> [AI-COO] task cards -> [AGENT] local implementation -> [AGENT] evidence report
 *   -> [AGENT] independent review -> [SYSTEM] final CI on final SHA -> [HUMAN] merge approval -> [AI-COO] release note
 * "The AI-COO orchestrates, but a human approves critical state changes." Illegal moves THROW a LifecycleError
 * and the run is never mutated (advance() returns a new run).
 */
const { validateCooInputs } = require("../../day-16-ai-coo/src/validateCooInputs");
const { validateTaskCards } = require("./taskCards");

const STAGES = [
  { state: "objective_approved", label: "Approved objective", actor: "HUMAN" },
  { state: "tasks_generated", label: "Task cards + dependencies", actor: "AI-COO" },
  { state: "implemented", label: "Local implementation", actor: "TASK AGENT" },
  { state: "evidence_reported", label: "Evidence report", actor: "TASK AGENT" },
  { state: "reviewed", label: "Independent review", actor: "REVIEW AGENT" },
  { state: "ci_passed", label: "Final CI on final SHA", actor: "SYSTEM" },
  { state: "merge_approved", label: "Merge approval", actor: "HUMAN" },
  { state: "release_note_drafted", label: "Release note", actor: "AI-COO" },
];
const ORDER = ["created", ...STAGES.map((s) => s.state)];
const at = (state) => ORDER.indexOf(state);

class LifecycleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LifecycleError";
    this.code = code;
  }
}

const EVENTS = {
  approve_objective: { actor: "human", from: ["created"] },
  generate_tasks: { actor: "ai_coo", from: ["objective_approved"] },
  implement: {
    actor: "task_agent",
    from: [
      "tasks_generated",
      "implemented",
      "evidence_reported",
      "reviewed",
      "ci_passed",
    ],
  },
  report_evidence: { actor: "task_agent", from: ["implemented"] },
  review: { actor: "review_agent", from: ["evidence_reported"] },
  final_ci: { actor: "system", from: ["reviewed"] },
  approve_merge: { actor: "human", from: ["ci_passed"] },
  draft_release_note: { actor: "ai_coo", from: ["merge_approved"] },
};
const text = (v) => typeof v === "string" && v.trim().length > 0;

/** Starts a run. Refuses to start unless the Day 16 operating inputs are valid. */
function createRun(inputs) {
  const check = validateCooInputs(inputs);
  if (!check.valid)
    throw new LifecycleError(
      "INPUTS_INVALID",
      `AI-COO inputs invalid: ${check.errors.map((e) => e.code).join(", ")}`,
    );
  return {
    state: "created",
    objective: inputs.objective,
    objectiveApprovedBy: inputs.objectiveApprovedBy,
    humanOwner: inputs.humanOwner,
    humanReviewer: inputs.humanReviewer,
    cards: null,
    sha: null,
    implementer: null,
    evidence: null,
    review: null,
    ci: null,
    mergeApproval: null,
    releaseNote: null,
    log: [],
  };
}

function advance(run, event) {
  const rule = EVENTS[event && event.type];
  if (!rule)
    throw new LifecycleError("UNKNOWN_EVENT", `unknown event "${event && event.type}"`);
  const actor = event.actor || {};
  const payload = event.payload || {};

  if (actor.kind !== rule.actor) {
    if (event.type === "approve_merge")
      throw new LifecycleError(
        "MERGE_NOT_HUMAN",
        `${actor.kind || "unknown"} "${actor.id}" cannot approve a merge: only a human can`,
      );
    throw new LifecycleError(
      "WRONG_ACTOR",
      `${event.type} must be performed by ${rule.actor}, not ${actor.kind || "unknown"}`,
    );
  }
  if (!rule.from.includes(run.state)) {
    if (run.state === "merge_approved" || run.state === "release_note_drafted") {
      if (event.type === "implement")
        throw new LifecycleError(
          "CODE_FROZEN",
          "the change is already approved for merge; open a new run for new code",
        );
    }
    const expected = ORDER[ORDER.indexOf(rule.from[0])];
    throw new LifecycleError(
      "WRONG_STATE",
      `cannot ${event.type} while the run is "${run.state}" (steps cannot be skipped; expected "${expected}")`,
    );
  }

  const next = structuredClone(run);
  const note = (msg) =>
    next.log.push({ event: event.type, actor: `${actor.kind}:${actor.id}`, note: msg });

  switch (event.type) {
    case "approve_objective":
      if (actor.id !== run.objectiveApprovedBy)
        throw new LifecycleError(
          "NOT_THE_APPROVER",
          `only ${run.objectiveApprovedBy} may approve the objective`,
        );
      next.state = "objective_approved";
      note("objective approved");
      break;
    case "generate_tasks": {
      const result = validateTaskCards(payload.cards);
      if (!result.valid)
        throw new LifecycleError(
          "CARDS_INVALID",
          `task cards rejected: ${result.errors.map((e) => e.code).join(", ")}`,
        );
      next.cards = payload.cards;
      next.state = "tasks_generated";
      note(`${payload.cards.length} cards in ${result.waves.length} waves`);
      break;
    }
    case "implement": {
      if (!text(payload.sha))
        throw new LifecycleError("SHA_REQUIRED", "implement needs the commit sha");
      const invalidated = at(run.state) > at("implemented");
      next.sha = payload.sha;
      next.implementer = { kind: actor.kind, id: actor.id };
      next.evidence = next.review = next.ci = null;
      next.state = "implemented";
      note(
        invalidated || run.sha
          ? "new commit: evidence, review and CI are INVALIDATED and must be redone on the new SHA"
          : "implemented",
      );
      break;
    }
    case "report_evidence": {
      if (payload.sha !== run.sha)
        throw new LifecycleError(
          "SHA_MISMATCH",
          `evidence is for ${payload.sha}, but the implementation is ${run.sha}`,
        );
      const checks = Array.isArray(payload.checks) ? payload.checks : [];
      if (checks.length === 0 || checks.some((c) => !text(c.command)))
        throw new LifecycleError(
          "EVIDENCE_EMPTY",
          "evidence must list the exact commands that were run",
        );
      const failing = checks.filter((c) => c.exitCode !== 0);
      if (failing.length)
        throw new LifecycleError(
          "EVIDENCE_FAILING",
          `failing checks cannot go to review: ${failing.map((c) => c.command).join(", ")}`,
        );
      next.evidence = { sha: payload.sha, checks };
      next.state = "evidence_reported";
      note(`${checks.length} checks, all exit 0`);
      break;
    }
    case "review": {
      if (actor.id === run.implementer.id)
        throw new LifecycleError(
          "SELF_REVIEW",
          `${actor.id} implemented this change and cannot review it`,
        );
      if (payload.sha !== run.sha)
        throw new LifecycleError(
          "SHA_MISMATCH",
          `review is for ${payload.sha}, but the candidate is ${run.sha}`,
        );
      if (!["approve", "changes_requested"].includes(payload.verdict))
        throw new LifecycleError(
          "VERDICT",
          'verdict must be "approve" or "changes_requested"',
        );
      next.review = {
        sha: payload.sha,
        verdict: payload.verdict,
        by: actor.id,
        findings: payload.findings ?? [],
      };
      if (payload.verdict === "changes_requested") {
        next.state = "tasks_generated";
        next.evidence = null;
        note("changes requested: back to implementation");
      } else {
        next.state = "reviewed";
        note("approved by an independent reviewer");
      }
      break;
    }
    case "final_ci": {
      if (payload.sha !== run.sha)
        throw new LifecycleError(
          "SHA_MISMATCH",
          `CI ran on ${payload.sha}, but the candidate is ${run.sha}`,
        );
      if (payload.status !== "passed") {
        const meaning =
          payload.status === "not_run" || payload.status === "infra_blocked"
            ? `"${payload.status}" means the checks did NOT run - Not Run is not Passed`
            : `status is "${payload.status}"`;
        throw new LifecycleError("CI_NOT_PASSED", `final CI did not pass: ${meaning}`);
      }
      next.ci = { sha: payload.sha, status: "passed" };
      next.state = "ci_passed";
      note("CI passed on the final SHA");
      break;
    }
    case "approve_merge":
      if (actor.id === run.humanOwner)
        throw new LifecycleError(
          "SELF_MERGE",
          `${actor.id} is the author and cannot approve their own merge`,
        );
      if (actor.id !== run.humanReviewer)
        throw new LifecycleError(
          "NOT_THE_REVIEWER",
          `only the named reviewer (${run.humanReviewer}) may approve the merge`,
        );
      next.mergeApproval = { by: actor.id, sha: run.sha };
      next.state = "merge_approved";
      note(`merge of ${run.sha} approved by ${actor.id}`);
      break;
    case "draft_release_note":
      if (!text(payload.text))
        throw new LifecycleError("NOTE_EMPTY", "release note text is required");
      next.releaseNote = payload.text;
      next.state = "release_note_drafted";
      note("release note drafted");
      break;
  }
  return next;
}

/** Non-throwing wrapper for UIs and logs. */
function tryAdvance(run, event) {
  try {
    return { ok: true, run: advance(run, event) };
  } catch (err) {
    if (err instanceof LifecycleError)
      return { ok: false, code: err.code, message: err.message, run };
    throw err;
  }
}

module.exports = { createRun, advance, tryAdvance, LifecycleError, STAGES, ORDER };
