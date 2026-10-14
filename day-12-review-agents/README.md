# Day 12 - Review Agents: audit AI code with an AI reviewer

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

**Lab:** take the Day 11 output, deliberately introduce an unsafe API call, feed the diff to a Review Agent using the production brief, and observe whether bounding the context makes the AI catch the flaw.

## What was done (in order, see `git log`)

| Step                                                    | Commit / location                                               |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Day 11 output = `day-11-task-agent/LoginForm.tsx`       | `feat/day-11-task-agent`                                        |
| **PR #104 candidate** with deliberately unsafe endpoint | `454e0ec`                                                       |
| Review brief + diff + prompts + **Review Agent output** | `review-input/`, `review-output/REVIEW_AGENT_OUTPUT.md`         |
| Tests that reproduce each finding (**red**: 6 failures) | `test/day-12-reproduce-findings`, `evidence/vulnerable_run.txt` |
| Fixes for every High/Med finding (**green**)            | `fix/day-12-review-findings`                                    |
| Live side-by-side demo + screenshots                    | `demo/`, `evidence/screenshots/`                                |

## The planted flaws (what the lab asked for)

- `SELECT * FROM users WHERE id = ` + raw `userId` from the query string (SQL injection)
- The caller is authenticated but the client chooses whose row to read (authorization bypass / IDOR)
- `SELECT *` returns `password_hash` and `api_key` (data leakage)
- Raw database error text returned to the client
- Only a happy-path test (it passes while everything leaks)

## Run it

```bash
npm install
npx jest day-11 day-12                 # fixed code: all green
npm run test:vulnerable                # EXPECTED TO FAIL: proves the findings are real
npm run demo:day12                     # then open http://localhost:4100 and click "Run all attacks"
node day-12-review-agents/tools/show_attacks.js   # prints the real HTTP responses
```

Screenshots can be regenerated with `python3 day-12-review-agents/tools/capture_screenshots.py` (needs Playwright).

## Fake data only

All users, password hashes and API keys in `src/db.js` are **fake lab values**. Nothing real is stored or used (Non-negotiable Rule 2).
`lab/vulnerable/profileRoutes.v1.js` is **intentionally vulnerable**: never import or deploy it.

## Honest notes (Rule 5)

1. **The Review Agent here was Claude applying the brief, not an independent session.** Because the same assistant wrote the planted flaws, independence is limited. Paste `review-input/PROMPT_bounded.txt` into a fresh LLM session and compare with `review-output/REVIEW_AGENT_OUTPUT.md` for your own lab record.
2. **The bounded-vs-unbounded comparison was NOT run.** `PROMPT_unbounded.txt` is provided as the control. Record what your LLM returns for each in the table below.
3. Every finding was **confirmed by a real test**, not just asserted by the reviewer.
4. Finding 7 (server-side email validation) is deferred: there is no login endpoint in this PR.
5. Hosted CI was not run. PR #104 is a local lab label; no GitHub PR with that number exists.

### Observation table (fill in with your own LLM runs)

| Prompt                                       | Findings caught | Followed output format? | Style noise? |
| -------------------------------------------- | --------------- | ----------------------- | ------------ |
| `PROMPT_bounded.txt` (brief + diff)          |                 |                         |              |
| `PROMPT_unbounded.txt` ("what do you think") |                 |                         |              |
