# Day 20 - Demo script (about 5 minutes)

**Goal:** show the working capstone, then prove it, then be honest about what is not done.
**Before you start (once):**

```bash
npm install
node day-19-capstone-leave-request/tools/build_demo.mjs
```

Open `day-19-capstone-leave-request/demo/index.html` in Chromium. If anything breaks, the same states are in `day-19-capstone-leave-request/evidence/screenshots/`.

| Time | Show                                                                                                | Say                                                                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00 | The page                                                                                            | "A responsive Leave Request form built from a 123-word brief, with fake data only. Leave used to be requested by email, so overlaps went unnoticed."        |
| 0:20 | Click **Submit** on the empty form                                                                  | "Four problems are announced, focus moves to the summary, each message links to its field." Press Tab then Enter on a link to jump to the field.            |
| 0:50 | Fill it **with the keyboard only**: type `Sick` in the select, type the dates, type a reason, Enter | "No mouse. Success banner takes focus; the request appears as Pending; the form clears."                                                                    |
| 1:30 | Enter dates 4-5 Nov                                                                                 | "Overlaps my approved leave: refused, and the message names the clashing dates."                                                                            |
| 1:50 | Open `?scenario=empty`, `?scenario=error` then **Try again**, `?scenario=slow`                      | "All four states: loading, empty, error with retry, success. Focus stays put after Try again."                                                              |
| 2:20 | Resize to 320px                                                                                     | "No sideways scrolling; controls are at least 44px."                                                                                                        |
| 2:40 | Terminal: `npm run verify`, then `python3 day-19-capstone-leave-request/tools/browser_flow.py`      | "Prettier, TypeScript and all the tests; then the one keyboard-only browser test."                                                                          |
| 3:20 | `python3 day-19-capstone-leave-request/tools/states_and_a11y.py`                                    | "axe-core: 0 violations in 7 states, and a negative control proves it can fail."                                                                            |
| 3:45 | Open `MISTAKE_CAUGHT.md` and the red-to-green regression test                                       | "My review found a real bug that 42 tests missed: a stale error after fixing the _other_ date. Failing test first, then a one-line fix, everything re-run." |
| 4:30 | Open `demo/dashboard.html`                                                                          | "Numbers come from a real run. Note the two zeros: no PR opened and no hosted CI run yet, because those need my GitHub account."                            |
| 4:50 | Close                                                                                               | "Next: open the Draft PR, name a human reviewer, enable branch protection."                                                                                 |

## Questions to be ready for

1. **Why a server re-validation if the form already validates?** The client is untrusted; client checks are UX only (Day 4).
2. **Why not a disabled submit button?** A disabled button leaves the tab order; I use `aria-disabled` and an early return.
3. **Why inject "today"?** So tests and screenshots are deterministic.
4. **What did the AI get wrong?** `MISTAKE_CAUGHT.md`: two product bugs and three tooling mistakes (all in `day-19.../MISTAKES.md`).
5. **How do you know your tests are good?** I planted 12 bugs (5 validation, 4 component, 3 flow) and all were caught; and I know that does not cover bugs I did not think of (that is how the stale-error bug got through).
6. **Is it accessible?** axe-core: 0 violations; keyboard-only flow passes; two a11y bugs were found by review, not by axe. No manual screen-reader test yet.
7. **How did you keep token use low?** `EXPLAIN_PROMPTS_AND_TOKENS.md`.
8. **Can you merge it?** No: a second human must approve (Rule 4). Branch protection is the owner's setting.
