# Day 17 - AI-COO Task Lifecycle

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

**Lab:** take a vague feature request ("Add dark mode") and use an LLM acting as AI-COO to split it into scoped tasks. This day also implements the handbook's lifecycle: _"The AI-COO orchestrates, but a human approves critical state changes."_

| What                                                                              | Where                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 8 task cards for "Add dark mode" (the AI-COO's output)                            | `outputs/dark_mode_task_cards.json`, readable: `outputs/DARK_MODE_BREAKDOWN.md` |
| Task card validator (bounded files, deps, no parallel file conflicts, human gate) | `src/taskCards.js`                                                              |
| Lifecycle state machine with human gates                                          | `src/lifecycle.js`                                                              |
| 49 tests                                                                          | `tests/taskCards.test.js` (21), `tests/lifecycle.test.js` (28)                  |
| Demo (real code in the browser)                                                   | `demo/index.html`, `evidence/screenshots/`                                      |

## The split ("Add dark mode" -> 8 cards, 5 waves)

Wave 1 (parallel): **T1** colour tokens, **T2** theme state hook. Wave 2 (parallel): **T3** accessible toggle, **T4** move styles onto tokens. Wave 3 (parallel): **T5** WCAG contrast test, **T6** browser flow. Wave 4: **T7** independent review. Wave 5: **T8** human merge approval.
The target is the Leave Request capstone (Day 19), so file paths point into `day-19-capstone-leave-request/`.

## Lifecycle rules enforced in code

- Only the named human approves the objective and the merge; **an agent can never approve a merge** (`MERGE_NOT_HUMAN`); **the author cannot** (`SELF_MERGE`); only the named reviewer can (`NOT_THE_REVIEWER`).
- Steps cannot be skipped or reordered (`WRONG_STATE`), and the wrong kind of actor is refused (`WRONG_ACTOR`).
- The implementing agent cannot review its own work (`SELF_REVIEW`).
- Evidence must list the exact commands and all must exit 0 (`EVIDENCE_FAILING`, `EVIDENCE_EMPTY`).
- Review, evidence and CI must all refer to the **same SHA** (`SHA_MISMATCH`).
- CI `not_run` / `infra_blocked` is **Not Run, not Passed** (`CI_NOT_PASSED`).
- **Final Candidate Rule:** a new commit wipes evidence, review and CI; after merge approval the code is frozen (`CODE_FROZEN`).
- A run cannot start unless the Day 16 operating inputs are valid (`INPUTS_INVALID`).

## Honest notes (Rule 5)

1. **The "LLM acting as AI-COO" was Claude**, using the Day 16 brief. The validator and 21 tests are what check the cards, not the author's confidence. Cards are validated structurally; whether the _scope_ is right is a human judgement.
2. The dark-mode feature itself is **not built**: the lab is about decomposition. Its files will exist only if you choose to implement the cards.
3. The reviewer in the tests/demo, "Ayesha Khan", is a **fake lab persona** (see Day 16). Your real reviewer must still be named in `day-16-ai-coo/inputs/coo_inputs.json`.
4. Identity is a string in this model. A real system takes it from authenticated accounts and branch protection, not from a payload.
5. The lifecycle models the handbook's pipeline; it does not talk to GitHub or CI.

## Run it

```bash
npx jest day-17 --verbose
node day-17-coo-lifecycle/tools/render_cards.js
node day-17-coo-lifecycle/tools/build_demo.mjs && python3 day-17-coo-lifecycle/tools/capture_screenshots.py
```
