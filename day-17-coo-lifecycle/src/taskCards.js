/**
 * Day 17 lab: validate the task cards an AI-COO produces from a vague request.
 * A card is only acceptable if it is bounded: explicit files, explicit non-goals, checkable criteria,
 * known dependencies, and no two cards that can run in parallel touching the same file.
 */
const ASSIGNEES = ["task-agent", "review-agent", "human"];
const GLOB = /[*?{}[\]]/;
const text = (v) => typeof v === "string" && v.trim().length > 0;
const items = (v) => (Array.isArray(v) ? v.filter(text) : []);

function validateTaskCards(cards) {
  const errors = [];
  const add = (code, message, card) => errors.push({ code, message, card: card ?? null });
  if (!Array.isArray(cards) || cards.length === 0) {
    return {
      valid: false,
      errors: [{ code: "NO_CARDS", message: "no task cards", card: null }],
      waves: [],
      order: [],
    };
  }

  const ids = new Set();
  for (const c of cards) {
    if (!text(c.id)) add("ID", "every card needs an id");
    else if (ids.has(c.id)) add("DUPLICATE_ID", `duplicate id ${c.id}`, c.id);
    ids.add(c.id);
  }

  for (const c of cards) {
    const id = c.id;
    if (!text(c.title)) add("TITLE", "title is required", id);
    if (!ASSIGNEES.includes(c.assignee))
      add(
        "ASSIGNEE",
        `assignee must be one of ${ASSIGNEES.join(", ")} (the AI-COO never implements)`,
        id,
      );
    if (!text(c.stopAndReport))
      add("STOP_AND_REPORT", "a stop-and-report condition is required", id);
    if (c.assignee === "task-agent") {
      if (items(c.allowedFiles).length === 0)
        add("ALLOWED_FILES", "task cards need explicit allowed files", id);
      if (items(c.allowedFiles).some((f) => GLOB.test(f) || f.endsWith("/")))
        add(
          "GLOB_FILES",
          "allowed files must be explicit paths, no globs or whole directories",
          id,
        );
      if (items(c.nonGoals).length < 1)
        add("NON_GOALS", "at least one non-goal is required", id);
      if (items(c.acceptanceChecks).length < 2)
        add("ACCEPTANCE", "at least 2 acceptance checks are required", id);
      if (items(c.requiredTests).length < 1)
        add("TESTS", "at least one required local test is required", id);
    }
    if (c.assignee === "review-agent" && items(c.allowedFiles).length > 0)
      add("REVIEW_WRITES", "review cards may not own files (reviewers do not write)", id);
    for (const dep of Array.isArray(c.dependsOn) ? c.dependsOn : []) {
      if (!ids.has(dep)) add("UNKNOWN_DEPENDENCY", `depends on unknown card ${dep}`, id);
      if (dep === id) add("SELF_DEPENDENCY", "a card cannot depend on itself", id);
    }
  }

  // topological layers (Kahn); leftovers mean a cycle
  const byId = new Map(cards.map((c) => [c.id, c]));
  const remaining = new Set(ids);
  const done = new Set();
  const waves = [];
  while (remaining.size > 0) {
    const wave = [...remaining].filter((id) =>
      (byId.get(id).dependsOn ?? []).every((d) => done.has(d) || !ids.has(d)),
    );
    if (wave.length === 0) {
      add("CYCLE", `dependency cycle among: ${[...remaining].join(", ")}`);
      break;
    }
    waves.push(wave);
    wave.forEach((id) => {
      remaining.delete(id);
      done.add(id);
    });
  }

  // two cards that are not ordered by dependencies may run in parallel -> they must not share a file
  if (!errors.some((e) => e.code === "CYCLE")) {
    const ancestors = new Map();
    const collect = (id) => {
      if (ancestors.has(id)) return ancestors.get(id);
      const set = new Set();
      for (const d of byId.get(id).dependsOn ?? []) {
        if (!ids.has(d)) continue;
        set.add(d);
        collect(d).forEach((x) => set.add(x));
      }
      ancestors.set(id, set);
      return set;
    };
    const list = [...ids];
    list.forEach(collect);
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const A = list[a];
        const B = list[b];
        if (ancestors.get(A).has(B) || ancestors.get(B).has(A)) continue;
        const shared = items(byId.get(A).allowedFiles).filter((f) =>
          items(byId.get(B).allowedFiles).includes(f),
        );
        if (shared.length)
          add(
            "PARALLEL_FILE_CONFLICT",
            `${A} and ${B} can run in parallel but both own ${shared.join(", ")}`,
            `${A}+${B}`,
          );
      }
    }
  }

  const gates = cards.filter((c) => c.assignee === "human");
  if (gates.length !== 1)
    add("MERGE_GATE", "exactly one human merge-approval card is required");
  else {
    const gate = gates[0];
    const dependsOnReview = (gate.dependsOn ?? []).some(
      (d) => byId.get(d)?.assignee === "review-agent",
    );
    if (!dependsOnReview)
      add(
        "GATE_AFTER_REVIEW",
        "the human merge gate must depend on an independent review card",
        gate.id,
      );
    if (
      cards.some((c) => c.assignee !== "human" && (c.dependsOn ?? []).includes(gate.id))
    )
      add("GATE_IS_LAST", "no agent card may run after the human merge gate", gate.id);
  }
  if (!cards.some((c) => c.assignee === "review-agent"))
    add("REVIEW_CARD", "an independent review card is required");

  return { valid: errors.length === 0, errors, waves, order: waves.flat() };
}

module.exports = { validateTaskCards };
