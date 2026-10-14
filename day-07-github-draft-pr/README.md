# Day 7 - Why GitHub is Used: Push a Branch and Open a Draft PR

## Why GitHub (not just a backup)

System of record: branch protection (no direct pushes to `main`), PR discussion, issues, immutable audit log for release evidence.

- **Commit** = snapshot. **Branch** = pointer to a line of commits for isolated work. **PR** = formal request to merge a branch, starting review.

## Lab steps (run these yourself - they need your GitHub login)

```bash
git remote add origin https://github.com/mirzayasirabdullahbaig07/AI-Internship.git
git push -u origin main
git push -u origin feat/day-07-draft-pr
gh pr create --draft --base main --head feat/day-07-draft-pr \
  --title "docs(day-07): draft PR for GitHub workflow lab" --body-file day-07-github-draft-pr/DRAFT_PR.md
```

(Or use the "Compare & pull request" button and choose **Create draft pull request**.)

> Status: the Draft PR **has not been opened** - it requires your GitHub account. `DRAFT_PR.md` is the ready-to-paste body.
