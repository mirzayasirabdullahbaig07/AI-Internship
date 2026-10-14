# Day 15 - Security and Privacy

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

**Lab:** review an intentionally insecure Node.js endpoint and list the missing OWASP checks. **Check:** explain why hiding a "Delete" button in the frontend HTML is not authorization.

| What                                                           | Where                                      |
| -------------------------------------------------------------- | ------------------------------------------ |
| Intentionally insecure notes API (login, list, create, delete) | `lab/insecure/notesApi.js`                 |
| Missing OWASP Top 10:2025 checks, with line numbers and proof  | `review/OWASP_MISSING_CHECKS.md`           |
| Secure version fixing every finding                            | `src/notesApi.js`                          |
| 22 tests, one run against either implementation                | `tests/security.test.js`                   |
| Live demo of the Delete-button question                        | `demo/index.html`, `evidence/screenshots/` |
| Real `npm audit` output (A03)                                  | `evidence/npm_audit.txt`                   |

## Result (real runs)

- **Secure code:** 22 of 22 tests pass (`evidence/secure_run.txt`).
- **Insecure code:** 20 fail, 2 pass (`npm run test:insecure`, `evidence/insecure_run.txt`). The 2 that pass are legitimate behaviours (owners and admins may delete notes).
- **Demo:** 5 of 5 direct attacks exploit the insecure API; 5 of 5 are blocked by the secure API (`evidence/demo_verdicts.txt`).

## Privacy items covered

Data minimisation (responses return only `id`, `title`, `body`; login returns only a token), no passwords or tokens in logs, no stack traces or SQL in errors, no user enumeration, salted slow password hashing, and session expiry.

## Run it

```bash
npx jest day-15-security-privacy      # secure: all green
npm run test:insecure                 # EXPECTED to fail: proves the findings
npm run demo:day15                    # http://localhost:4300, click "Run all attacks"
```

## Honest notes (Rule 5)

1. **A bug in my own secure code was caught by the tests.** The first secure run failed the oversized-body test: I called `req.destroy()` before sending the 413 response, so clients saw a dropped connection. I fixed the code (drain the upload, answer 413 with `Connection: close`) and did not touch the assertion.
2. **A03 is a real finding, not a pass:** `npm audit` reports 19 moderate advisories, all in dev-only test tooling; runtime has 0. The suggested fix is a breaking downgrade of `babel-jest`, so I did not apply it. Recorded as accepted dev-only risk.
3. **A08 was not demonstrated or tested.** I list it as such instead of inventing a flaw.
4. The OWASP list used is the **2025** edition (checked against owasp.org). The handbook does not name an edition.
5. All users, passwords and notes are **fake lab data**. `lab/insecure/` is intentionally vulnerable: never import or deploy it.
6. The "reviewer" of the insecure endpoint was Claude, who also wrote it, so independence is limited; the tests are what make the findings trustworthy.
7. In-memory rate limiting and sessions suit a single-process lab; production would need a shared store.
