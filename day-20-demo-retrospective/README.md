# Day 20 - Demo, Review and Retrospective

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

The internship concludes with peer review and accountability: **Demonstrate, Explain, Identify, Review.**

| Handbook step                                                | Deliverable                                                                                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. **Demonstrate** the working capstone                      | `DEMO_SCRIPT.md` (5 minutes), `tools/demo_run.js` (runs the proof steps), `demo/dashboard.html` (all 20 days from real data), screenshots in `evidence/screenshots/` |
| 2. **Explain** the prompts and token choices                 | `EXPLAIN_PROMPTS_AND_TOKENS.md` (measured numbers, with caveats) and `STUDY_GUIDE.md`                                                                                |
| 3. **Identify** one mistake the AI made and how it was fixed | `MISTAKE_CAUGHT.md`: a stale server-side error that 42 tests missed; fixed red-then-green                                                                            |
| 4. **Review** a peer's PR with the Week 2 criteria           | `PEER_REVIEW.md`: a practice review of the capstone (no peer PR was available)                                                                                       |
| Retrospective                                                | `RETROSPECTIVE.md`: 15 things that went wrong, rubric self-assessment, owner checklist                                                                               |

## What changed in the code today

The review found **two real bugs in the Day 19 capstone**, fixed with failing-first regression tests (`day-19.../tests/LeaveRequestForm.regression.test.tsx`) and re-verified on the new SHA (`76f4683`): a stale server-side error, and keyboard focus lost after "Try again". Day 20 itself adds only a small dashboard (`src/dashboard.js`, 5 tests).

## Honest notes (Rule 5)

1. **The review is a practice review** by the same AI that wrote the code. Get a human peer to review the capstone PR.
2. **The prompts are the bounded prompts the work followed**, not a transcript of what you typed. Explain-it-yourself material is in `STUDY_GUIDE.md`.
3. Token numbers are chars/4 estimates (see Day 13).
4. **Not done here:** opening any PR, hosted CI, naming a human reviewer, branch protection, a manual screen-reader test. See the owner checklist in `RETROSPECTIVE.md`.

## Run it

```bash
npx jest day-20 --verbose
node day-20-demo-retrospective/tools/demo_run.js          # verify + safety + flow + a11y + responsive
node day-20-demo-retrospective/tools/build_dashboard.js   # builds demo/dashboard.html from a real jest run
python3 day-20-demo-retrospective/tools/capture_screenshots.py
```
