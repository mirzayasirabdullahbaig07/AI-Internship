/** @jest-environment node */
const { createRun, advance, tryAdvance, LifecycleError } = require("../src/lifecycle");
const inputs = require("../../day-16-ai-coo/inputs/coo_inputs.demo-complete.json");
const { cards } = require("../outputs/dark_mode_task_cards.json");

const SHA1 = "a1b2c3d";
const SHA2 = "e4f5a6b";
const human = (id) => ({ kind: "human", id });
const OWNER = human("Mirza Yasir Abdullah Baig");
const REVIEWER = human("Ayesha Khan"); // fake lab persona from the Day 16 demo inputs
const COO = { kind: "ai_coo", id: "coo-1" };
const TASK = { kind: "task_agent", id: "task-agent-1" };
const REVIEW = { kind: "review_agent", id: "review-agent-1" };
const SYSTEM = { kind: "system", id: "ci" };
const checks = [{ command: "npm run verify", exitCode: 0 }];

const E = {
  approve: () => ({ type: "approve_objective", actor: OWNER }),
  tasks: () => ({ type: "generate_tasks", actor: COO, payload: { cards } }),
  implement: (sha = SHA1, actor = TASK) => ({
    type: "implement",
    actor,
    payload: { sha },
  }),
  evidence: (sha = SHA1) => ({
    type: "report_evidence",
    actor: TASK,
    payload: { sha, checks },
  }),
  review: (sha = SHA1, verdict = "approve", actor = REVIEW) => ({
    type: "review",
    actor,
    payload: { sha, verdict },
  }),
  ci: (sha = SHA1, status = "passed") => ({
    type: "final_ci",
    actor: SYSTEM,
    payload: { sha, status },
  }),
  merge: (actor = REVIEWER) => ({ type: "approve_merge", actor, payload: {} }),
  note: () => ({
    type: "draft_release_note",
    actor: COO,
    payload: { text: "Dark mode added." },
  }),
};
const run = (events, start = createRun(inputs)) =>
  events.reduce((r, e) => advance(r, e), start);
const upToCi = () => [
  E.approve(),
  E.tasks(),
  E.implement(),
  E.evidence(),
  E.review(),
  E.ci(),
];
const code = (fn) => {
  try {
    fn();
  } catch (e) {
    return e instanceof LifecycleError ? e.code : `OTHER:${e.message}`;
  }
  return "NO_ERROR";
};

describe("Day 17: AI-COO task lifecycle", () => {
  test("the full handbook pipeline reaches release_note_drafted with a complete audit log", () => {
    const final = run([...upToCi(), E.merge(), E.note()]);
    expect(final.state).toBe("release_note_drafted");
    expect(final.log.map((l) => l.event)).toEqual([
      "approve_objective",
      "generate_tasks",
      "implement",
      "report_evidence",
      "review",
      "final_ci",
      "approve_merge",
      "draft_release_note",
    ]);
    expect(final.mergeApproval).toEqual({ by: "Ayesha Khan", sha: SHA1 });
  });

  test("a run cannot even start without valid AI-COO inputs (Day 16)", () => {
    expect(code(() => createRun({ ...inputs, humanReviewer: null }))).toBe(
      "INPUTS_INVALID",
    );
    expect(
      code(() => createRun(require("../../day-16-ai-coo/inputs/coo_inputs.json"))),
    ).toBe("INPUTS_INVALID");
  });

  test("advance never mutates the run it is given", () => {
    const r0 = createRun(inputs);
    const snapshot = JSON.stringify(r0);
    advance(r0, E.approve());
    expect(JSON.stringify(r0)).toBe(snapshot);
  });

  describe("human gates", () => {
    test("an AI agent cannot approve the merge (MERGE_NOT_HUMAN)", () => {
      const r = run(upToCi());
      for (const agent of [
        COO,
        TASK,
        REVIEW,
        SYSTEM,
        { kind: "human_lookalike", id: "Ayesha Khan" },
      ]) {
        expect(code(() => advance(r, E.merge(agent)))).toBe("MERGE_NOT_HUMAN");
      }
    });
    test("the author cannot approve their own merge (SELF_MERGE)", () => {
      expect(code(() => advance(run(upToCi()), E.merge(OWNER)))).toBe("SELF_MERGE");
    });
    test("a human who is not the named reviewer cannot approve", () => {
      expect(code(() => advance(run(upToCi()), E.merge(human("Some Stranger"))))).toBe(
        "NOT_THE_REVIEWER",
      );
    });
    test("only the named human approves the objective; an agent cannot", () => {
      expect(
        code(() => advance(createRun(inputs), { type: "approve_objective", actor: COO })),
      ).toBe("WRONG_ACTOR");
      expect(
        code(() =>
          advance(createRun(inputs), {
            type: "approve_objective",
            actor: human("Stranger"),
          }),
        ),
      ).toBe("NOT_THE_APPROVER");
    });
  });

  describe("steps cannot be skipped or reordered", () => {
    test.each([
      ["tasks before the objective is approved", [], E.tasks()],
      ["implementation before task cards", [E.approve()], E.implement()],
      ["review before evidence", [E.approve(), E.tasks(), E.implement()], E.review()],
      ["CI before review", [E.approve(), E.tasks(), E.implement(), E.evidence()], E.ci()],
      [
        "merge approval before CI",
        [E.approve(), E.tasks(), E.implement(), E.evidence(), E.review()],
        E.merge(),
      ],
      ["release note before merge approval", upToCi(), E.note()],
    ])("%s -> WRONG_STATE", (_l, before, event) => {
      expect(code(() => advance(run(before), event))).toBe("WRONG_STATE");
    });
    test("the wrong kind of actor is refused (agent drafting the review, human writing code)", () => {
      const r = run([E.approve(), E.tasks(), E.implement(), E.evidence()]);
      expect(code(() => advance(r, { ...E.review(), actor: COO }))).toBe("WRONG_ACTOR");
      expect(
        code(() =>
          advance(run([E.approve(), E.tasks()]), { ...E.implement(), actor: OWNER }),
        ),
      ).toBe("WRONG_ACTOR");
    });
  });

  describe("independent review and honest evidence", () => {
    test("the agent that implemented the change cannot review it (SELF_REVIEW)", () => {
      const r = run([E.approve(), E.tasks(), E.implement(), E.evidence()]);
      expect(
        code(() =>
          advance(r, E.review(SHA1, "approve", { kind: "review_agent", id: TASK.id })),
        ),
      ).toBe("SELF_REVIEW");
    });
    test("evidence with a failing command is refused", () => {
      const r = run([E.approve(), E.tasks(), E.implement()]);
      const bad = {
        type: "report_evidence",
        actor: TASK,
        payload: { sha: SHA1, checks: [{ command: "npm test", exitCode: 1 }] },
      };
      expect(code(() => advance(r, bad))).toBe("EVIDENCE_FAILING");
    });
    test("evidence must name the commands that were run", () => {
      const r = run([E.approve(), E.tasks(), E.implement()]);
      expect(
        code(() =>
          advance(r, {
            type: "report_evidence",
            actor: TASK,
            payload: { sha: SHA1, checks: [] },
          }),
        ),
      ).toBe("EVIDENCE_EMPTY");
    });
    test("review of a different SHA than the candidate is refused", () => {
      const r = run([E.approve(), E.tasks(), E.implement(), E.evidence()]);
      expect(code(() => advance(r, E.review(SHA2)))).toBe("SHA_MISMATCH");
    });
    test("changes_requested sends the run back to implementation and clears the evidence", () => {
      const r = advance(
        run([E.approve(), E.tasks(), E.implement(), E.evidence()]),
        E.review(SHA1, "changes_requested"),
      );
      expect(r.state).toBe("tasks_generated");
      expect(r.evidence).toBeNull();
      expect(code(() => advance(r, E.ci()))).toBe("WRONG_STATE");
    });
    test.each([
      ["not_run", /Not Run is not Passed/],
      ["infra_blocked", /Not Run is not Passed/],
      ["failed", /failed/],
    ])("final CI status %s does not pass", (status, message) => {
      const r = run([E.approve(), E.tasks(), E.implement(), E.evidence(), E.review()]);
      const result = tryAdvance(r, E.ci(SHA1, status));
      expect(result.ok).toBe(false);
      expect(result.code).toBe("CI_NOT_PASSED");
      expect(result.message).toMatch(message);
      expect(result.run.state).toBe("reviewed"); // unchanged
    });
    test("CI on a different SHA than the candidate is refused", () => {
      const r = run([E.approve(), E.tasks(), E.implement(), E.evidence(), E.review()]);
      expect(code(() => advance(r, E.ci(SHA2)))).toBe("SHA_MISMATCH");
    });
  });

  describe("Final Candidate Rule: a new commit invalidates approvals", () => {
    test("pushing a new SHA after review and CI wipes evidence, review and CI", () => {
      const r = advance(run(upToCi()), E.implement(SHA2));
      expect(r.state).toBe("implemented");
      expect(r.sha).toBe(SHA2);
      expect([r.evidence, r.review, r.ci]).toEqual([null, null, null]);
      expect(r.log.at(-1).note).toMatch(/INVALIDATED/);
      expect(code(() => advance(r, E.merge()))).toBe("WRONG_STATE");
    });
    test("approving the merge for the OLD sha is impossible after a new commit", () => {
      const r = advance(run(upToCi()), E.implement(SHA2));
      expect(code(() => advance(r, E.ci(SHA1)))).toBe("WRONG_STATE");
    });
    test("after merge approval the code is frozen", () => {
      expect(code(() => advance(run([...upToCi(), E.merge()]), E.implement(SHA2)))).toBe(
        "CODE_FROZEN",
      );
    });
  });

  test("task cards that fail validation stop the pipeline (CARDS_INVALID)", () => {
    const bad = structuredClone(cards);
    bad[1].allowedFiles = ["src/**"];
    const r = run([E.approve()]);
    expect(
      code(() =>
        advance(r, { type: "generate_tasks", actor: COO, payload: { cards: bad } }),
      ),
    ).toBe("CARDS_INVALID");
  });

  test("unknown events and a missing sha are rejected", () => {
    expect(
      code(() =>
        advance(createRun(inputs), { type: "deploy_to_production", actor: COO }),
      ),
    ).toBe("UNKNOWN_EVENT");
    expect(
      code(() =>
        advance(run([E.approve(), E.tasks()]), {
          type: "implement",
          actor: TASK,
          payload: {},
        }),
      ),
    ).toBe("SHA_REQUIRED");
  });
});
