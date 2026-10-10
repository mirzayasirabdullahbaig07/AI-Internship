# Day 10 - Honest Reporting

## Real report for this repository (Weeks 1-2, Days 1-10)

| Field                                                                                                   | Value                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Command run                                                                                             | `npm run verify` (= `prettier --check .` && `tsc --noEmit` && `jest`)                                                                                                                                                                                                                                                                                                    |
| Result                                                                                                  | Exit code **0**. Prettier clean, TypeScript clean, **3 suites / 24 tests passed**                                                                                                                                                                                                                                                                                        |
| Final candidate SHA                                                                                     | `00f1a62d9fe1a5d3e4eb81a5e15b36753cbf8502` (`00f1a62`)                                                                                                                                                                                                                                                                                                                   |
| Also run                                                                                                | `python3 tools/verify_day02.py` -> 10/10 browser checks PASS (overflow, hover, Tab order, Enter, labels)                                                                                                                                                                                                                                                                 |
| **Limitations**                                                                                         | **Hosted CI (GitHub Actions) was NOT run.** `.github/workflows/verify.yml` is untested. The Day 7 Draft PR is not yet opened (needs the owner's GitHub login). JSONPlaceholder (`fetchPosts`) was not called (no internet in the build sandbox). Screenshots come from local headless Chromium, not a staging site. Day 8's review was a self-review, not a peer review. |
| Commits after `00f1a62` are documentation only (Day 10 notes and the report) - no source files changed. |

## Mock honest report (handbook format: failing hosted CI)

> Command: `npm run verify` -> exit 0, 24/24 tests passed locally on SHA `7f8a9b2`.
> Hosted CI on the same SHA: **failed at `docker compose up -d db`** with `toomanyrequests` (Docker Hub pull limit); **0 test steps executed in CI**.
> Classification: **Infrastructure block** (not a code failure). CI status for this SHA: **Not Run**.
> Limitation: local evidence only; hosted CI must be re-run after the rate limit resets. No code was changed in response.
> _(Illustrative example - SHA `7f8a9b2` is invented for the lab format.)_

## Anti-patterns avoided (Non-negotiable Rule 5)

Not claiming green when steps did not run - not weakening assertions to pass - not hiding the Day 5 scorer weaknesses - stating what was not run.
