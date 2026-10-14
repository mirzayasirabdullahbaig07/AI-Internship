# Day 19 - Capstone: Responsive Leave Request Form

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

The synthesis of all four weeks: a human-in-the-loop build of a production-style feature with AI, using the Day 13 brief, plan first, small commits, tests that matter, security boundaries and honest evidence.

## Requirements -> evidence

| Handbook requirement                   | How it is met                                                                                                                                                                                  | Evidence                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Responsive "Leave Request" form        | Mobile-first CSS: 1 column at 320px, 2 date columns from 390px, form + list from 768px                                                                                                         | `evidence/responsive_check.txt`, `evidence/screenshots/responsive_*.png` |
| Local, typed fake data                 | `types.ts`, `leaveApi.ts` (fake people only)                                                                                                                                                   | `src/`                                                                   |
| Input validation                       | Pure `validateLeaveRequest`: required fields, real dates, no past start, end >= start, max 30 days, reason 10-500 characters, no overlap with approved leave. The fake **server re-validates** | 31 unit tests + 10 API tests                                             |
| Loading, Error, Empty, Success         | `LoadState` union; loading spinner, error + "Try again", friendly empty state, list + confirmation banner                                                                                      | `state_*.png`, `evidence/a11y_audit.txt`                                 |
| Full keyboard navigation (a11y)        | Native controls, logical tab order, visible focus ring, error summary with links to fields, focus moved to summary / confirmation, no keyboard traps                                           | keyboard-only browser flow, `evidence/browser_flow_output.txt`           |
| One focused component test             | `tests/LeaveRequestForm.test.tsx` (1 test)                                                                                                                                                     | mutation-checked: 4/4 planted bugs caught                                |
| One browser flow test                  | `tools/browser_flow.py` (real Chromium, keyboard only, 6 steps)                                                                                                                                | mutation-checked: 3/3 caught (`evidence/flow_mutation_check.txt`)        |
| Clean Git history ending in a Draft PR | 6 focused Conventional Commits (see `DAY19_PLAN.md`); Draft PR text in `DRAFT_PR.md`                                                                                                           | `git log`                                                                |

## Results (real runs)

- `npm run verify` on `76f4683` (clean worktree): Prettier clean, TypeScript clean, **21 suites, 255 tests passed**.
- Day 19 tests: 44 (31 validation, 10 API, **1 focused component test**, 2 regression tests), plus **1 browser flow**.
- axe-core: **0 violations across 7 UI states**; negative control detects 5 deliberate violations.
- Responsive: no horizontal overflow at 320 / 390 / 768 / 1280px; every control at least 44px tall.

## What is in the folder

`src/` types, validation, fake API, form, styles, demo entry - `tests/` - `tools/` (flow, mutation check, audit, responsive check, demo build) - `evidence/` - `DAY19_PLAN.md` - `MISTAKES.md` - `DRAFT_PR.md`

## Honest notes (Rule 5)

1. **The Draft PR is not opened.** `DRAFT_PR.md` is its text; opening it needs your GitHub account. Hosted CI was not run. A human reviewer who is not you must approve it.
2. **Automated accessibility checks are partial.** axe-core finds only some WCAG problems. No manual screen-reader test was done.
3. Keyboard flow and screenshots are **Chromium only**; native date inputs differ across browsers (and the flow's date typing assumes an English-US date field).
4. Everything is fake and in memory: no real backend, authentication or time zones (only the local calendar date). The demo pins "today" to 2026-10-12.
5. `MISTAKES.md` lists what the AI got wrong: **two product bugs** (a stale server-side error, and keyboard focus lost after Try again; both found in the Day 20 review and fixed with red-then-green regression tests) and three mistakes in test tooling.

## Run it

```bash
npx jest day-19 --verbose
node day-19-capstone-leave-request/tools/build_demo.mjs
python3 day-19-capstone-leave-request/tools/browser_flow.py           # the ONE browser flow test
python3 day-19-capstone-leave-request/tools/states_and_a11y.py        # axe-core on 7 states
python3 day-19-capstone-leave-request/tools/responsive_check.py
```

Open `day-19-capstone-leave-request/demo/index.html` after building. Scenarios: `?scenario=empty|error|slow|submit-error`.
