# AI-Internship

**Author:** Mirza Yasir Abdullah Baig - AI Engineer
**GitHub:** [@mirzayasirabdullahbaig07](https://github.com/mirzayasirabdullahbaig07)
**Repo:** https://github.com/mirzayasirabdullahbaig07/AI-Internship

Work log for the _AI-Assisted Software Development Internship_ - **Weeks 1-2 (Days 1-10)**.
The full write-up with screenshots is in [`report/Internship_Report_Days_1-10.pdf`](report/Internship_Report_Days_1-10.pdf).

| Day | Topic                                          | Folder                                                 |
| --- | ---------------------------------------------- | ------------------------------------------------------ |
| 1   | Software delivery basics - static profile card | [`day-01-profile-card`](day-01-profile-card)           |
| 2   | Responsive sign-in form (CSS Grid)             | [`day-02-responsive-signin`](day-02-responsive-signin) |
| 3   | Typed task list + four UI states               | [`day-03-typed-tasks`](day-03-typed-tasks)             |
| 4   | API consumption with retry                     | [`day-04-api-retry`](day-04-api-retry)                 |
| 5   | Password strength meter + critical review      | [`day-05-password-strength`](day-05-password-strength) |
| 6   | Local Git discipline                           | [`day-06-git-local`](day-06-git-local)                 |
| 7   | GitHub + Draft PR                              | [`day-07-github-draft-pr`](day-07-github-draft-pr)     |
| 8   | PR review and merge discipline                 | [`day-08-pr-review`](day-08-pr-review)                 |
| 9   | Local-first CI test matrix                     | [`day-09-local-test-matrix`](day-09-local-test-matrix) |
| 10  | CI failures and honest reporting               | [`day-10-ci-failures`](day-10-ci-failures)             |

## Run it

```bash
npm install
npm run verify                      # prettier --check, tsc --noEmit, jest
python3 tools/verify_day02.py       # browser checks (needs: pip install playwright && playwright install chromium)
```

## Push to GitHub

```bash
git remote add origin https://github.com/mirzayasirabdullahbaig07/AI-Internship.git
git push -u origin main
git push origin --all               # pushes the per-day branches too
```

Then open the Day 7 Draft PR using `day-07-github-draft-pr/DRAFT_PR.md` (see that folder's README).
