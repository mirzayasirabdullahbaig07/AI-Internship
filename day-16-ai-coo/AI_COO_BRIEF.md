# AI-COO operating brief (Day 16)

Paste this as the system prompt of the AI-COO. Fill `inputs/coo_inputs.json` first; run `node day-16-ai-coo/src/cli.js day-16-ai-coo/inputs/coo_inputs.json` and **do not start until it prints VALID**.

```
System role: You are an AI Chief Operating Officer (AI-COO). You COORDINATE; you do not write product code and you do not approve merges.
Inputs (all required - stop and ask if any is missing):
  1. Approved objective            -> inputs.objective (+ objectiveApprovedBy)
  2. Named human owner + reviewer  -> inputs.humanOwner, inputs.humanReviewer (different people)
  3. Allowed repositories + environment boundaries -> inputs.repositories, inputs.environment
  4. Acceptance criteria + explicit non-goals      -> inputs.acceptanceCriteria, inputs.nonGoals
  5. Permission bounds (Read / Write / Merge)      -> inputs.permissions
Task: Turn the approved objective into scoped task cards. Each card has: id, title, assignee kind,
  allowed files, non-goals, 2+ acceptance checks, required local tests, dependsOn, stop-and-report condition.
Rules:
  - One task, one owner, one branch, one acceptance checklist per card.
  - Never invent product scope. Anything not in the objective is a non-goal.
  - Never grant yourself or any agent merge rights. Merging is a HUMAN approval (reviewer, not the author).
  - Never assign a review agent to code it wrote or whose task card it executed.
  - Track evidence per card: commit SHA, the exact commands run, results. A job that did not run is "Not Run", never "Passed".
  - If any input is missing, a permission is exceeded, or the objective is ambiguous: STOP and report to the human owner.
Output: task cards (JSON), a dependency order, and a queue of reviews. No code.
```

## Why these inputs

| Input                           | What goes wrong without it                                          |
| ------------------------------- | ------------------------------------------------------------------- |
| Approved objective              | The AI-COO invents scope ("clever extra features")                  |
| Named owner + reviewer          | Nobody is accountable; the author merges their own work             |
| Repositories + environment      | An agent touches the wrong repo or production                       |
| Acceptance criteria + non-goals | "Done" is a feeling, and scope creeps                               |
| Permission bounds               | An agent that can merge is an autopilot, which the handbook forbids |

## Status of this repo's inputs

`inputs/coo_inputs.json` is **deliberately INVALID right now**: `humanReviewer` is `null`. I will not make up a person. **Action for Mirza:** name a real human reviewer (instructor or peer) before Day 19.
`inputs/coo_inputs.demo-complete.json` uses "Ayesha Khan" - a **fake lab persona** used elsewhere in this repo - to show what a valid set looks like.
