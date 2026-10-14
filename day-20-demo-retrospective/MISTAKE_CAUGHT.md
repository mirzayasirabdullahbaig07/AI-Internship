# Day 20 - One specific mistake the AI made in Day 19, caught and fixed

## The mistake: stale server-side error on a valid form (F1)

**What the AI wrote** (`LeaveRequestForm.tsx`): when the user edits a field, clear the server error _for that field_:
the error "These dates overlap your approved leave" is attached to **Start date**, so only editing Start date cleared it.

**Why it is wrong:** an overlap is caused by **both** dates. If the user fixes the **End date**, the overlap is gone, but the start-date error stays: a red error, an error summary and `aria-invalid="true"` on a form that is valid. A screen-reader user is told a valid field is invalid, and nothing says how to proceed.

## How it was caught

1. **Reading the code** during the review with the question _"what else can make this error false?"_
2. **Reproducing it** in a real browser (load error so the client cannot check overlaps, submit overlapping dates, then change only the end date).

|                | After correcting only the End date                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Before the fix | `['Error: These dates overlap your approved leave from 2026-11-02 to 2026-11-06.']`, summary visible, `aria-invalid` = `true` |
| After the fix  | `[]`, no summary, `aria-invalid` = `false`                                                                                    |

## Why 42 tests, 12 planted-bug checks and axe-core all missed it

- No test exercised "server error, then the **other** field changes".
- Mutation checks only measure whether your tests catch the bugs you **think to plant**.
- axe-core inspects one page state; this bug lives in a **transition**.

## The fix, red then green

1. `tests/LeaveRequestForm.regression.test.tsx` written first and run **red**: `Expected length: 0, Received length: 2`.
2. One-line change: `setServerErrors({})` on any edit (server errors can depend on several fields).
3. Test green, real-browser probe clean, **all checks re-run on the new commit** (Final Candidate Rule): 21 suites and 255 tests on `76f4683`, axe 0 violations, flow 6/6, 3/3 flow mutants caught.

## Related catches in the same review

- **F2 (focus lost after "Try again")**: same method (ask what happens to focus when a control disappears; reproduce; failing test; fix).
- **M1 (my own harness reported "MISSED" for a mutation it never applied)**: caught by reading the traceback above the table. See `day-19-capstone-leave-request/MISTAKES.md`.

## Lessons I would repeat

1. **Ask "what else can make this false?"** of every piece of state you clear, hide or disable.
2. **Reproduce before reporting, and write the failing test before the fix.**
3. A green suite, a clean accessibility scan and a passing mutation check are **evidence, not proof**.
