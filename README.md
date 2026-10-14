# AI-Internship

**Author:** Mirza Yasir Abdullah Baig - AI Engineer
**GitHub:** [@mirzayasirabdullahbaig07](https://github.com/mirzayasirabdullahbaig07)
**Repo:** https://github.com/mirzayasirabdullahbaig07/AI-Internship

Work log for the _AI-Assisted Software Development Internship_ - **all 4 weeks (Days 1-20)**, one folder per day with code, tests, demo, screenshots and a README.
All PDF reports are in [`reports/`](reports): Days 1-10, Day 12, and Days 13-20.

| Day | Topic                                                    | Folder                                                           |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Software delivery basics - static profile card           | [`day-01-profile-card`](day-01-profile-card)                     |
| 2   | Responsive sign-in form (CSS Grid)                       | [`day-02-responsive-signin`](day-02-responsive-signin)           |
| 3   | Typed task list + four UI states                         | [`day-03-typed-tasks`](day-03-typed-tasks)                       |
| 4   | API consumption with retry                               | [`day-04-api-retry`](day-04-api-retry)                           |
| 5   | Password strength meter + critical review                | [`day-05-password-strength`](day-05-password-strength)           |
| 6   | Local Git discipline                                     | [`day-06-git-local`](day-06-git-local)                           |
| 7   | GitHub + Draft PR                                        | [`day-07-github-draft-pr`](day-07-github-draft-pr)               |
| 8   | PR review and merge discipline                           | [`day-08-pr-review`](day-08-pr-review)                           |
| 9   | Local-first CI test matrix                               | [`day-09-local-test-matrix`](day-09-local-test-matrix)           |
| 10  | CI failures and honest reporting                         | [`day-10-ci-failures`](day-10-ci-failures)                       |
| 11  | Task agent: LoginForm email validation                   | [`day-11-task-agent`](day-11-task-agent)                         |
| 12  | Review agents: audit an unsafe PR, prove and fix         | [`day-12-review-agents`](day-12-review-agents)                   |
| 13  | Keeping token use low (1,177 -> 123 words)               | [`day-13-token-diet`](day-13-token-diet)                         |
| 14  | Tests that matter (component + browser + mutation check) | [`day-14-tests-that-matter`](day-14-tests-that-matter)           |
| 15  | Security and privacy (OWASP Top 10:2025)                 | [`day-15-security-privacy`](day-15-security-privacy)             |
| 16  | AI-COO operating inputs                                  | [`day-16-ai-coo`](day-16-ai-coo)                                 |
| 17  | AI-COO task lifecycle ("Add dark mode" split)            | [`day-17-coo-lifecycle`](day-17-coo-lifecycle)                   |
| 18  | Working safely with agents (scanner, audit, handoff)     | [`day-18-working-safely`](day-18-working-safely)                 |
| 19  | Capstone: responsive Leave Request form                  | [`day-19-capstone-leave-request`](day-19-capstone-leave-request) |
| 20  | Demo, review and retrospective                           | [`day-20-demo-retrospective`](day-20-demo-retrospective)         |

## Run it

```bash
npm install
npm run verify                      # prettier --check, tsc --noEmit, jest
npm run test:vulnerable             # Day 12: EXPECTED to fail (proves the review findings)
npm run demo:day12                  # Day 12 live demo on http://localhost:4100
npm run test:insecure               # Day 15: EXPECTED to fail (proves the OWASP findings)
npm run demo:day15                  # Day 15 live demo on http://localhost:4300
npm run safety                      # Day 18 repository safety audit
node day-20-demo-retrospective/tools/demo_run.js   # Day 20: verify + capstone proof steps
python3 tools/verify_day02.py       # browser checks (needs: pip install playwright && playwright install chromium)
```

## Push to GitHub

```bash
git remote add origin https://github.com/mirzayasirabdullahbaig07/AI-Internship.git
git push -u origin main
git push origin --all               # pushes the per-day branches too
```

Then open the Day 7 Draft PR using `day-07-github-draft-pr/DRAFT_PR.md` (see that folder's README).
