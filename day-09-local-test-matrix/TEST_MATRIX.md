# Day 9 - Local-first CI Without Waste: Test Matrix

Hosted CI is not a debugger. Run proportionate checks **locally** first (shift left), then push once.

## Scenario A - UI button change (e.g. change the Follow button label/colour)

Change type: _Copy / Style-only_ + light _UI interaction_.

| Step                                                              | Command                         | Proves                                                                   |
| ----------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| 1                                                                 | `npm run format:check`          | Prettier formatting is clean                                             |
| 2                                                                 | `npm run typecheck`             | `tsc --noEmit`: no type errors                                           |
| 3                                                                 | `npx jest <changed-component>`  | Component test: renders, click handler fires                             |
| 4                                                                 | `python3 tools/verify_day02.py` | Focused browser check: hover/focus, no overflow at 320px, keyboard works |
| 5                                                                 | `git diff --stat`               | Only intended files changed                                              |
| Hosted CI: **not needed** before push; run once on the final SHA. |

## Scenario B - Database migration (e.g. add `followers` column + backfill)

Change type: _Data / Security_. Needs real-database evidence; mocks are not enough.

| Step | Command                                      | Proves                                                |
| ---- | -------------------------------------------- | ----------------------------------------------------- |
| 1    | `docker compose up -d db`                    | Real Postgres (same major version as prod)            |
| 2    | `npm run migrate:up`                         | Migration applies on an empty and on a seeded DB      |
| 3    | `npm run migrate:down && npm run migrate:up` | Migration is reversible / idempotent                  |
| 4    | `npm run test:integration`                   | Queries, constraints, backfill correct on the real DB |
| 5    | Contract check: `npm run test:contract`      | API responses still match the agreed schema           |
| 6    | Tenant isolation test                        | User A cannot read User B's rows after the change     |
| 7    | `npm run verify`                             | Format + types + unit tests still green               |

> Scenario B commands are **theoretical** for this repo (there is no database here). They show the evidence a real migration PR would need.

## Final Candidate Rule

After review fixes are done, run **ONE** verify suite on the exact commit SHA (`npm run verify`). Do not push again unless a correction is required.

## Evidence for this repo

`npm run verify` was actually run on the final candidate commit - result in `day-10-ci-failures/HONEST_REPORT.md`.
