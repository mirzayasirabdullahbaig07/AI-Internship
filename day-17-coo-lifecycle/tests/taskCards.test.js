/** @jest-environment node */
const { validateTaskCards } = require("../src/taskCards");
const { cards } = require("../outputs/dark_mode_task_cards.json");

const clone = () => structuredClone(cards);
const codes = (c) => validateTaskCards(c).errors.map((e) => e.code);
const card = (c, id) => c.find((x) => x.id === id);

describe("Day 17 lab: 'Add dark mode' split into scoped task cards", () => {
  test("the AI-COO's cards are valid and form 5 dependency waves", () => {
    const r = validateTaskCards(cards);
    expect(r.errors).toEqual([]);
    expect(r.waves).toEqual([["T1", "T2"], ["T3", "T4"], ["T5", "T6"], ["T7"], ["T8"]]);
  });

  test("every implementation card has files, non-goals, 2+ acceptance checks and a test", () => {
    for (const c of cards.filter((x) => x.assignee === "task-agent")) {
      expect(c.allowedFiles.length).toBeGreaterThan(0);
      expect(c.nonGoals.length).toBeGreaterThan(0);
      expect(c.acceptanceChecks.length).toBeGreaterThanOrEqual(2);
      expect(c.requiredTests.length).toBeGreaterThan(0);
    }
  });

  test("no two implementation cards own the same file", () => {
    const files = cards.flatMap((c) => c.allowedFiles);
    expect(new Set(files).size).toBe(files.length);
  });

  test.each([
    ["duplicate id", (c) => (card(c, "T2").id = "T1"), "DUPLICATE_ID"],
    [
      "unknown dependency",
      (c) => card(c, "T3").dependsOn.push("T99"),
      "UNKNOWN_DEPENDENCY",
    ],
    ["dependency cycle", (c) => card(c, "T1").dependsOn.push("T5"), "CYCLE"],
    [
      "glob in allowed files",
      (c) => (card(c, "T4").allowedFiles = ["day-19-capstone-leave-request/src/**"]),
      "GLOB_FILES",
    ],
    [
      "whole directory as allowed files",
      (c) => (card(c, "T4").allowedFiles = ["day-19-capstone-leave-request/src/"]),
      "GLOB_FILES",
    ],
    ["no non-goals", (c) => (card(c, "T2").nonGoals = []), "NON_GOALS"],
    [
      "only one acceptance check",
      (c) => (card(c, "T2").acceptanceChecks = ["one"]),
      "ACCEPTANCE",
    ],
    ["no required test", (c) => (card(c, "T2").requiredTests = []), "TESTS"],
    ["no stop-and-report", (c) => (card(c, "T2").stopAndReport = ""), "STOP_AND_REPORT"],
    [
      "AI-COO assigned to implement",
      (c) => (card(c, "T2").assignee = "ai-coo"),
      "ASSIGNEE",
    ],
    [
      "review card owns files",
      (c) => (card(c, "T7").allowedFiles = ["x.ts"]),
      "REVIEW_WRITES",
    ],
    [
      "parallel cards share a file",
      (c) =>
        card(c, "T2").allowedFiles.push(
          "day-19-capstone-leave-request/src/theme/tokens.css",
        ),
      "PARALLEL_FILE_CONFLICT",
    ],
    ["no review card", (c) => c.splice(c.indexOf(card(c, "T7")), 1), "REVIEW_CARD"],
    [
      "merge gate not after review",
      (c) => (card(c, "T8").dependsOn = ["T6"]),
      "GATE_AFTER_REVIEW",
    ],
    [
      "agent card after the human gate",
      (c) => card(c, "T6").dependsOn.push("T8"),
      "GATE_IS_LAST",
    ],
    ["two human gates", (c) => (card(c, "T6").assignee = "human"), "MERGE_GATE"],
  ])("rejects: %s", (_label, change, expected) => {
    const c = clone();
    change(c);
    expect(codes(c)).toContain(expected);
  });

  test("sharing a file is fine when cards are ordered by a dependency", () => {
    const c = clone();
    card(c, "T5").allowedFiles.push("day-19-capstone-leave-request/src/styles.css"); // T5 runs after T4, which owns it
    expect(codes(c)).not.toContain("PARALLEL_FILE_CONFLICT");
  });

  test("empty and garbage input never throw", () => {
    for (const bad of [null, undefined, [], "x", 5])
      expect(validateTaskCards(bad).valid).toBe(false);
  });
});
