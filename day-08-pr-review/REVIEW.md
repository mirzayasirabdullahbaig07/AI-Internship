# Day 8 - PR Review & Merge Discipline

Rule: **review the diff, not the author.** Focus: scope boundaries, data security, missing tests, accessibility, release risk. Never merge your own PR.

> **Honest note:** the lab asks me to review a _partner's_ PR. I do not have a partner here, so this is a practice review of my own Day 4 diff (`feat/day-04-api-retry`). Replace it with a real review on a peer's PR on GitHub.

## Review comment (actionable, one edge case)

**File:** `day-04-api-retry/fetchWithRetry.ts` - `return (await res.json()) as T;`
**Risk:** Low-Med (wasted requests, misleading errors)
**Finding:** If the server returns `200` with a non-JSON body (e.g. an HTML error page from a proxy), `res.json()` throws a `SyntaxError`. The `catch` treats every non-`HttpError` as a _network_ failure and **retries**, hammering the server with identical bad requests and finally surfacing a confusing `SyntaxError`.
**Required fix:** wrap `res.json()`, throw a dedicated non-retryable error, add a test that asserts exactly one request is made.
**Proof:** a failing test was written first (`Tests: 1 failed, 6 passed`), then fixed (`Tests: 7 passed`). See `report/evidence/day08_before_after.txt`.

## Checklist applied

- [x] Diff stays inside scope (only `day-04-api-retry/`)
- [x] No secrets / tokens committed (token is a parameter)
- [x] Unhappy paths tested (401, 5xx, drops, bad body)
- [x] Test proves behaviour (counts requests made), not just "does not throw"
- [ ] Not reviewed: accessibility (no UI in this diff)

## Mandatory PR body for this change

**Problem solved:** Invalid JSON on a 200 response was retried pointlessly.
**Files changed:** `fetchWithRetry.ts` (+InvalidResponseError), `fetchWithRetry.test.ts` (+1 test), `day-08-pr-review/*`, `.github/pull_request_template.md`.
**Risk / permissions affected:** None - no auth or data-access logic changed.
**Local checks run:** `npx jest day-04` -> 7 passed.
**Known limits:** No jitter on backoff; `retries` is not validated for negative/NaN values (candidate follow-up).
**Final SHA:** see `git log` after merge (recorded in the Day 10 report).
