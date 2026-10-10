# Review Agent output - PR #104

**Brief used:** `review-input/REVIEW_BRIEF.txt` (verbatim). **Input:** `review-input/PR-104.diff`.
**Line numbers** refer to the files at commit `454e0ec` (the PR candidate).
**Reviewer:** Claude (AI) applying the brief. See the README: this is not an independent session, so re-run `PROMPT_bounded.txt` in a fresh session for your own lab record.

---

### Finding 1

- **Risk Level:** High
- **Finding:** `day-12-review-agents/src/profileRoutes.js:20` builds SQL by concatenating the raw `userId` query value (read at line 18): `"SELECT * FROM users WHERE id = " + userId`. SQL injection: `userId=1 OR 1=1` returns every row; a `UNION SELECT` can read any column.
- **Required Fix:** Use a parameterized statement (`... WHERE id = ?`) and validate the id as a bounded positive integer before use; reject anything else with 400.

### Finding 2

- **Risk Level:** High
- **Finding:** Authorization bypass (IDOR). `profileRoutes.js:12` authenticates the caller, but the result (`callerId`) is never compared with the requested `userId` (line 18). The client chooses whose row to read; `LoginForm.tsx:21` sends the id from the browser. Any logged-in user can read any other user's profile.
- **Required Fix:** Derive the target from the verified session on the server (`/api/profile` = caller only). If reading another user is a requirement, enforce server-side "self or admin" and return 403 otherwise. Never trust a client-supplied identity.

### Finding 3

- **Risk Level:** High
- **Finding:** Data leakage. `profileRoutes.js:20` uses `SELECT *` and line 22 serializes every column, so `password_hash` and `api_key` are returned to the browser. `LoginForm.tsx:25` only needs `name`.
- **Required Fix:** Select an explicit allow-list of columns (e.g. `id, name, email`) and map to a response object; never serialize raw rows. Add a test asserting secret fields are absent.

### Finding 4

- **Risk Level:** Med
- **Finding:** Internal error disclosure. `profileRoutes.js:25` returns `err.message` to the client, exposing SQL/engine details that help an attacker refine injection.
- **Required Fix:** Return a generic `{ "error": "Internal server error" }` with status 500, log the real error server-side only.

### Finding 5

- **Risk Level:** Med
- **Finding:** Missing tests for unhappy paths. The only test (`tests/profile.happy.test.js:19-22`) asserts status 200 and `rows.length > 0`; it would still pass while every user and every secret is leaked. No tests for 401, 403, 400, 404, injection, or leakage.
- **Required Fix:** Add tests for: no token / bogus token / `__proto__` token -> 401; other user's id -> not returned (403); injection payloads -> rejected; response contains no `password_hash` / `api_key`; error body contains no SQL text; invalid ids -> 400; unknown id -> 404 without enabling user enumeration.

### Finding 6

- **Risk Level:** Med
- **Finding:** Scope creep. The approved Day 11 scope was `LoginForm.tsx` only. This diff adds `auth.js`, `db.js`, `profileRoutes.js`, `server.js` and a new test, and `LoginForm.tsx:21` now performs a network call. None of this was in the approved brief.
- **Required Fix:** Split the server work into its own PR with its own task brief, owner and review; keep the LoginForm PR limited to the approved validation.

### Finding 7

- **Risk Level:** Low
- **Finding:** `LoginForm.tsx:21-25` does not check `res.ok` and has no `try/catch`: a network failure causes an unhandled promise rejection and the UI shows no error state; non-2xx JSON is parsed as if it were a profile. Also, validation (`includes("@")`) is client-side only and accepts `"@"`.
- **Required Fix:** Check `res.ok`, handle failures with a visible error state, and re-validate the email on the server when a login endpoint exists (the client is untrusted).
