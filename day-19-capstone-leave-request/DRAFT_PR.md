## Purpose

Capstone: a responsive, accessible **Leave Request** form with typed fake data, input validation, loading / error / empty / success states, keyboard support, one component test and one browser flow test.

## Problem solved

Leave is currently requested by email, chat or corridor, so overlapping leave goes unnoticed. This form validates the request, refuses overlap with approved leave, and confirms the result clearly.

## Files changed

New folder `day-19-capstone-leave-request/` only (types, pure validation, fake API, React form, styles, tests, tools, evidence), plus `axe-core` as a **dev** dependency. No existing day was modified.

## Risk / permissions affected

None for production: fake in-memory data, no network calls, no secrets, no new runtime dependencies. No auth or permission logic is added (the fake server only returns the signed-in employee's own requests and re-validates every submission).

## Local checks run

- `npm run verify` on the final SHA (clean worktree): Prettier clean, TypeScript clean, 21 suites, 255 tests passed
- `npx jest day-19`: 44 tests = 31 validation + 10 API + 1 focused component test + 2 regression tests
- Browser flow (1): `python3 day-19-capstone-leave-request/tools/browser_flow.py` - 6 steps passed (keyboard only)
- `python3 .../tools/states_and_a11y.py`: 0 axe-core violations across 7 UI states (negative control OK)
- `python3 .../tools/responsive_check.py`: no overflow at 320/390/768/1280px, all controls at least 44px tall
- `npm run safety`: no failing checks

## Known limits

- Hosted CI has **not** been run on this branch.
- Automated accessibility checks cover only part of WCAG; **no manual screen-reader test** was done.
- Keyboard flow and screenshots are Chromium only. Native date inputs differ between browsers.
- All data is fake and in memory; there is no real backend, authentication or time zones beyond the local calendar date.
- Overlap is checked against the employee's own approved leave only.
- Dark mode is **not** included (Day 17 is a task-card exercise).

## Screenshots

`evidence/screenshots/`: `state_loading`, `state_loaded_list`, `state_empty`, `state_load_error`, `state_validation_errors`, `state_submit_success`, `state_submit_error`, `flow_1..4`, `responsive_320/390/768/1280`.

## Final SHA

`76f4683`

Changed since the first candidate (`92ca4dd`): the Day 20 review found two bugs (a stale server-side error `027b17b`, and keyboard focus lost after Try again `76f4683`), each fixed with a failing-first regression test. Per the Final Candidate Rule all checks were re-run on the new SHA.

## Review

Needs a human reviewer who is **not** the author. **Do not self-merge** (Non-negotiable Rule 4). This is a Draft PR text: the PR has not been opened yet (needs the owner's GitHub account).
