# Day 16 - What an AI-COO Is For

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

An AI-COO is a coordination prompt/agent. It does not replace technical leadership: it turns an approved objective into scoped tasks, assigns them, tracks evidence and queues reviews. It needs five minimum inputs, and this day turns that rule into code.

| What                                                              | Where                                        |
| ----------------------------------------------------------------- | -------------------------------------------- |
| The AI-COO system prompt and why each input exists                | `AI_COO_BRIEF.md`                            |
| The five minimum inputs, filled in for the Leave Request capstone | `inputs/coo_inputs.json`                     |
| Validator (14 checks: every one reported pass or fail)            | `src/validateCooInputs.js`, CLI `src/cli.js` |
| 23 tests                                                          | `tests/validateCooInputs.test.js`            |
| Interactive demo running the real validator in the browser        | `demo/index.html`, `evidence/screenshots/`   |

## What the validator enforces

1. Approved objective, approved by a named **human**.
2. Named human owner **and** reviewer, who must be **different people** (never merge your own work), and neither can be an agent.
3. Explicit repository list (no wildcards); allowed environments; **production and secrets explicitly forbidden**.
4. 3+ acceptance criteria and at least one explicit non-goal.
5. Permission bounds for every agent: **no agent may merge**, none may write to "any" branch (least privilege), and a **review agent must exist and be read-only**.

## Result (real runs)

- Tests: 23 of 23 pass (`evidence/jest_run.txt`).
- `inputs/coo_inputs.json` is **INVALID on purpose**: the human reviewer is blank (`evidence/cli_output.txt`).
- `inputs/coo_inputs.demo-complete.json` is VALID. Demo verdicts: `evidence/demo_verdicts.txt`.

## Honest notes (Rule 5)

1. **Action needed from you:** name a real human reviewer in `inputs/coo_inputs.json` (instructor or peer). I did not invent one. "Ayesha Khan" in the demo file is a fake lab persona used across this repo.
2. **The tests found a gap in my validator.** With no agents defined, the "review agents are read-only" check passed vacuously (an empty object showed 13 failures, not 14). I fixed the validator to require that a review agent exists, because independent review is mandatory, and added a regression test. No assertion was weakened.
3. The 3-criteria minimum and the "agent-like name" regex are house rules I chose, not handbook text.
4. A name check cannot prove someone is human; it only catches obvious agent names. A real process needs identity from the platform (GitHub accounts, branch protection).

## Run it

```bash
npx jest day-16 --verbose
node day-16-ai-coo/src/cli.js day-16-ai-coo/inputs/coo_inputs.json    # exits 1 until a reviewer is named
node day-16-ai-coo/tools/build_demo.mjs && python3 day-16-ai-coo/tools/capture_screenshots.py
```
