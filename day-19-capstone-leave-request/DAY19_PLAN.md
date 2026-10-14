# Plan first, code second (Day 19)

The AI was given the Day 13 150-word brief (`day-13-token-diet/outputs/task_brief_150.txt`) ending in
`Return: a plan first, then a diff.` The plan below was reviewed **before** any code was written.

| Step | Commit                                                      | What                                                                                        | Proof                                        |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1    | `feat(day-19): add typed leave model and pure validation`   | `types.ts`, `validateLeaveRequest.ts` (pure)                                                | 31 unit tests, mutation-checked (5/5 caught) |
| 2    | `feat(day-19): add typed fake leave API`                    | `leaveApi.ts` with loading, empty, error, slow, submit-error scenarios; server re-validates | 10 tests                                     |
| 3    | `feat(day-19): add accessible LeaveRequestForm`             | `LeaveRequestForm.tsx` + ONE component test                                                 | mutation-checked (4/4 caught)                |
| 4    | `feat(day-19): add mobile-first responsive styles`          | `styles.css`, demo entry, bundle script                                                     | layout checks                                |
| 5    | `test(day-19): add the ONE keyboard-only browser flow test` | `tools/browser_flow.py` + mutation check                                                    | 3/3 caught                                   |
| 6    | `test(day-19): add all-states axe-core audit`               | 7 states, negative control, responsive check                                                | 0 violations                                 |

## Decisions made up front (the human's job, not the AI's)

- **Server is the authority:** the fake API re-validates every submission. Client checks are UX only (Day 4).
- **One message per field**, written for people, with the numbers in them ("you asked for 31").
- **Reason length counts characters as code points** so an emoji is one character.
- **Overlap rule:** only the employee's own _approved_ leave blocks a request; pending, rejected and other people's leave do not.
- **Today is injected** (`2026-10-12` in the demo) so tests and screenshots are deterministic.
- **No `required` attribute / native validation** (`noValidate`): one consistent, announced, accessible error system instead of browser pop-ups.
- **No `disabled` submit button** while submitting (it would fall out of the tab order): `aria-disabled` plus an early return.
- **Non-goals:** no auth, no real backend, no dark mode (that is the Day 17 task-card exercise), no new runtime libraries (React only).
