# Day 20 - Retrospective

**Author:** Mirza Yasir Abdullah Baig - AI Engineer. Facts below come from the repository's own logs and evidence files.

## What went well

- **Bounded work.** One task, one branch, one checklist per day; plan first; small Conventional Commits. The history reads as a story (see `git log --graph`).
- **Evidence over confidence.** Every day ends in a command anyone can re-run (`npm run verify`, browser scripts, audits), and every day's README lists what was **not** done.
- **Tests with teeth.** I planted bugs on purpose (6 on Day 14, 12 on Day 19) and wrote failing tests first for every bug a review found.
- **Security as a habit.** Server is the authority (Days 4, 12, 15, 19); fake data only; a secret scanner and a safety audit that separate "verified locally" from "needs the owner" (Day 18).

## What went badly (honestly)

- **Nothing reached GitHub from here.** No pull request is open, hosted CI has never run, no human reviewer is named, and branch protection / secret scanning are unverified. These are the owner's actions.
- **No true peer review.** The Day 8 and Day 20 reviews were practice reviews of my own work.
- **Two product bugs shipped inside a "green" capstone** and were found only by a critical read plus a real-browser probe (Day 20).

## The most useful lesson: a green (or red) result can lie

Everything that went wrong, by day (15 items):

| #   | Day | What looked fine / what happened                      | What was actually true                                                                      | Found by                     | Kind                    |
| --- | --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------- |
| 1   | 5   | Password meter rated `P@ssw0rd` and `Abcdefg1` "Good" | Both are in every cracking dictionary                                                       | Probing the real function    | Limitation (documented) |
| 2   | 8   | Retry wrapper looked correct                          | Invalid JSON on a 200 was **retried** pointlessly                                           | Review + failing test        | Product bug             |
| 3   | 12  | A "no token" test failed                              | A default parameter silently replaced `undefined` with a real token: **the test was wrong** | Reading why it failed        | Tooling misled          |
| 4   | 13  | Noise-word list worked                                | Substring `tea` would also match "team"                                                     | Reading the regex            | Pre-empted              |
| 5   | 14  | Browser journey "caught" a bug                        | It failed for the **wrong reason** (a glob did not match `?query`)                          | Doubting a surprising result | Tooling misled          |
| 6   | 15  | Secure API looked right                               | `req.destroy()` dropped the connection instead of sending 413                               | Failing test                 | Product bug             |
| 7   | 16  | Validator passed an empty input on one check          | "Review agents read-only" passed **vacuously** with no review agent                         | Failing test                 | Product bug             |
| 8   | 18  | Scanner flagged the Day 15 tests                      | A fake value; fixed with an explicit, reviewable allow marker                               | Audit run                    | Limitation / noise      |
| 9   | 18  | "Tracked .env" test                                   | Never tracked the file: the fixture's own `.gitignore` ignored it                           | Failing test                 | Tooling misled          |
| 10  | 19  | 42 tests + axe green                                  | Stale server error left on a valid form                                                     | Review + probe               | Product bug             |
| 11  | 19  | Keyboard flow green                                   | Focus fell to `<body>` after "Try again"                                                    | Review + probe               | Product bug             |
| 12  | 19  | Mutation table said "MISSED"                          | The mutation **was never applied** (Prettier had reformatted the target)                    | Traceback above the table    | Tooling misled          |
| 13  | 19  | Keyboard flow failed                                  | My test assumed one Tab per date field; Chromium has a calendar-button stop                 | Tracing focus per key        | Tooling misled          |
| 14  | 19  | First audit draft                                     | Waited for the result before doing the action                                               | Reading before running       | Pre-empted              |
| 15  | 20  | Dashboard built and committed                         | The two generated files were **unformatted**, so `npm run verify` went red                  | The final verify run         | Tooling bug             |

**Totals (15 items):** 5 product bugs, 6 tooling problems (5 where the **checking tool itself** gave a misleading result, plus 1 generated-file bug caught by the final `verify`), 2 pre-empted before they bit, 2 limitations. Roughly 40% of the problems were in the tests, harnesses and generators an AI wrote, not in the product.

## What I would do differently

1. Add the two review questions to every PR from day one: _"What else can make this false?"_ and _"What happens to focus / state when this disappears?"_
2. Treat every surprising green **and** every surprising red as a claim to verify (negative controls, failing-first, real-browser probes).
3. Open the Draft PR and name a real human reviewer on **Day 7**, not at the end.
4. Add component tests for the double-submit and failed-submit paths (review finding F3).

## Self-assessment against the rubric (evidence, not a grade)

| Area (weight)                            | Evidence strength   | Why                                                                               |
| ---------------------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| Problem understanding and planning (20%) | Strong              | 150-word brief with 13 checked criteria, plan first, written non-goals            |
| Code quality and scope discipline (20%)  | Strong              | Typed data, semantic HTML, new folders only; but two bugs shipped until review    |
| Testing and honest evidence (20%)        | Strong              | 260 tests, negative controls, mutation checks, "Not Run" never reported as passed |
| GitHub / PR workflow (15%)               | **Partial**         | Clean history and templates, but no PR opened and no peer review                  |
| Security, privacy, accessibility (15%)   | Strong with caveats | OWASP 2025 lab, axe 0 violations, keyboard flow; no manual screen-reader test     |
| Communication and teamwork (10%)         | **Partial**         | Per-day READMEs and logs exist; no teammate feedback received or given            |

**Pass rule reminder:** the rubric passes an intern only if they can explain their own code and tests **without reading an AI answer**. Use `STUDY_GUIDE.md` for that.

## Owner action checklist (cannot be done from here)

- [ ] Push `main` and the day branches; open the Day 7 and Day 19 **Draft PRs** from `DRAFT_PR.md`
- [ ] Name a **real human reviewer** in `day-16-ai-coo/inputs/coo_inputs.json`
- [ ] Enable **branch protection** and **secret scanning + push protection** (`day-18-working-safely/REPO_SAFETY.md`)
- [ ] Run hosted CI once on the final SHA (`.github/workflows/verify.yml` has never run)
- [ ] Get a **peer review** on the capstone PR; triage findings F3-F5 in `PEER_REVIEW.md`
- [ ] Try the capstone with a screen reader (manual accessibility test)
