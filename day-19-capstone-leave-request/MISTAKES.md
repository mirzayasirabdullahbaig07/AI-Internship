# Mistakes the AI made while building Day 19 (and how they were caught)

Honest log (Non-negotiable Rule 5). Five mistakes: **two product bugs in the form** (both found by code review after the capstone was merged) and **three in the test tooling the AI wrote**. All 42 earlier Day 19 tests, 12 planted-bug checks and the axe-core audit (0 violations) missed both product bugs: passing tests are not proof of correctness.

## M0 - Stale server-side error left on a valid form (product bug, found in the Day 20 review)

- **What happened:** when the list of requests failed to load, the client could not check overlaps, so the **server** rejected an overlapping request and the error was attached to "Start date". The form cleared a server error only when the user edited _that same field_. But an overlap depends on **both** dates. Fixing the **End date** left the overlap error, the error summary and `aria-invalid="true"` on a form that was now valid. A screen-reader user would be told a valid field is invalid.
- **How it was caught:** by reading `change()` during the Day 20 code review and asking "what else can make this error false?", then **reproducing it in a real browser** (probe output before the fix: error still shown after correcting the end date).
- **Why 42 tests and 12 planted-bug checks missed it:** no test exercised "server error, then the _other_ field changes". Mutation checks only measure whether tests catch the bugs you think to plant.
- **Fix (red, then green):** a failing regression test first (`tests/LeaveRequestForm.regression.test.tsx`, red: 2 stale elements remained), then `setServerErrors({})` on any edit. Browser probe after the fix: no error, no summary, `aria-invalid="false"`. Everything was re-run on the new commit (Final Candidate Rule).

## M0b - Keyboard focus lost after "Try again" (product bug, found in the Day 20 review)

- **What happened:** on the load-error state, pressing Enter on **Try again** removes that very button from the page. Focus fell back to `<body>`, so a keyboard or screen-reader user lost their place.
- **How it was caught:** by asking "what happens to focus when this control disappears?" and **reproducing it in a real browser**: before the fix focus was on `BODY`, after the fix on `H2 My requests`.
- **Why the checks missed it:** axe-core inspects a page state, not a transition, so it cannot see focus being dropped. This is a WCAG 2.4.3 (Focus Order) problem that needs a behavioural test.
- **Fix (red, then green):** failing regression test first, then focus is moved to the stable "My requests" heading (`tabIndex={-1}`) when a retry starts.

## M1 - A harness reported "MISSED" for a bug it never planted (most important)

- **What happened:** `tools/flow_mutation_check.sh` plants a bug in the source, rebuilds, and runs the browser flow. For the third mutant it printed `MISSED (flow still passed)`.
- **How it was caught:** the Python traceback above that line said `AssertionError` - the text to replace had not been found (Prettier had re-wrapped that statement onto several lines), so **no mutation was applied** and the unmodified code passed.
- **Why it matters:** a "missed bug" report was really "my experiment did not run". Trusting the table would have blamed the flow test for a harness error.
- **Fix:** match the real (formatted) source, and make an unapplied mutation print `HARNESS ERROR - mutation NOT applied` instead of `MISSED`. All 3 mutants are now applied and caught.

## M2 - The browser test assumed one Tab per date field

- **What happened:** the keyboard flow failed at step 3 with a bare `AssertionError`.
- **Cause:** after typing a date, Chromium's date input has an extra native tab stop (the calendar button) before the next field. The form was fine; the test's assumption was wrong. (Found by tracing focus after every key, not by guessing.)
- **Fix:** `tab_to(page, "End date")` presses Tab until the named control has focus, and the assertion now carries a message naming where focus actually is.

## M3 - First draft of the all-states audit waited for the result before doing the action

- **What happened:** the first draft of `states_and_a11y.py` waited for the "validation errors" element before clicking Submit, and contained leftover empty `pass` branches.
- **How it was caught:** reading the draft before running it (review before trust, Rule 1). Rewritten with an explicit "wait for list, act, wait for proof" sequence.

## Not mistakes, but checked

- The 31 validation tests and the component test passed on the first run. That is suspicious, so each was **mutation-checked** (5 and 4 planted bugs, all caught) instead of being trusted.
- The accessibility audit reported 0 violations. A **negative control** (a deliberately broken page) confirms the same harness reports 5 violations, so it is not blind.
