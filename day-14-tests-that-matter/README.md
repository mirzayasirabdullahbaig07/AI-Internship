# Day 14 - Tests That Matter

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

**Lab:** instruct an AI to create **one component test** and **one browser journey** for a form, then explain what each proves that the other misses.
Subject: the Day 11/12 `LoginForm` (email validation + profile load).

| File                              | What it is                                                           |
| --------------------------------- | -------------------------------------------------------------------- |
| `tests/component.test.tsx`        | THE one component test (Jest + Testing Library, network mocked)      |
| `tools/browser_journey.py`        | THE one browser journey (real Chromium, real API, keyboard only)     |
| `tests/weak.antipattern.test.tsx` | Anti-example: 5 weak AI-style tests (`toBeDefined`, `true === true`) |
| `tools/mutation_check.js`         | Plants 6 bugs in a copy of the form and records which layer notices  |
| `evidence/mutation_report.txt`    | The measured result                                                  |

## Result (real run)

| Planted bug                           | Weak tests | Component  | Browser    |
| ------------------------------------- | ---------- | ---------- | ---------- |
| M1 validation removed                 | missed     | CAUGHT     | CAUGHT     |
| M2 error text no longer red           | missed     | CAUGHT     | CAUGHT     |
| M3 HTTP 401 treated as success        | missed     | **missed** | CAUGHT     |
| M4 client sends `?userId=2` again     | missed     | CAUGHT     | **missed** |
| M5 apiBase ignored (wrong URL wiring) | missed     | **missed** | CAUGHT     |
| M6 Authorization header not sent      | missed     | CAUGHT     | CAUGHT     |
| **Caught (of 6)**                     | **0**      | **4**      | **5**      |

Component + browser together catch **6 of 6**. The baseline (unmodified code) passes every layer.

## Check: what each test proves that the other misses

- **Component test proves what the browser journey misses:** the exact contract of the component. It sees that the form calls `/api/profile` with the bearer header and **no client-chosen user id** (M4). In the browser, the fixed server ignores `?userId=2`, so the user-visible result looks correct even though the client broke its contract.
- **Browser journey proves what the component test misses:** that the pieces work together. It catches the 401 handling path (M3) and the wrong-URL wiring (M5), because the real bundle, real HTTP and a real server response are involved. The component test mocks `fetch`, so a mocked "ok" hides both.
- **Weak tests prove nothing:** they pass on broken code. `expect(true).toBe(true)` can never fail.

## Honest notes (Rule 5)

1. **I caught a wrong result in my own harness.** My first run said the browser journey "caught" M4. That was for the wrong reason: Playwright's glob `**/fixed/api/profile` does not match a URL with a `?query`, so my fake-401 interception silently did not fire. I switched to a regex, re-ran, and M4 correctly became "missed" by the browser. The numbers above are from the corrected run.
2. Six mutants is a small, hand-picked sample, not a full mutation-testing score.
3. The browser journey simulates the 401 with request interception (the server is real, the failure is injected).
4. The three test types in the handbook (unit, component, browser) are all used in this repo: pure unit tests (Days 3-5, 13), component tests (here), browser tests (Days 2, 12, 14).

## Run it

```bash
npx jest day-14 --verbose                         # component + weak tests
node day-14-tests-that-matter/tools/mutation_check.js   # the experiment (needs: pip install playwright && playwright install chromium)
```
