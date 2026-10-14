# Day 18 - Working Safely with Agents

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

Agents must run where **secret scanning is on, branch protection is enforced and audit logs exist**, and must **never get production credentials**. **Lab:** write a safe handoff report with ONLY a PR link, the final SHA, the scoped objective, test evidence and remaining blockers - no raw code, no secrets.

| What                                                                | Where                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Secret scanner (10 rules, redacted output, inline allow marker)     | `src/secretScanner.js`                                                         |
| Repo safety audit (`npm run safety`)                                | `src/repoSafety.js`, `src/safetyCli.js`                                        |
| Pre-commit hook that scans staged content (`npm run hooks:install`) | `src/hook.js`                                                                  |
| Handoff builder and validator                                       | `src/handoff.js`                                                               |
| Handoff generator that verifies an exact commit in a clean worktree | `tools/make_handoff.js`                                                        |
| **The lab deliverable: the safe handoff report**                    | `outputs/HANDOFF_DAYS_11-18.md`                                                |
| GitHub settings only the owner can enable                           | `REPO_SAFETY.md`                                                               |
| 44 tests                                                            | `tests/` (scanner 15, handoff 20, repo safety 9 - see `evidence/jest_run.txt`) |
| Demo (real code in the browser)                                     | `demo/index.html`, `evidence/screenshots/`                                     |

## Result (real runs)

- Safety audit: 8 pass, 0 fail, 4 MANUAL (`evidence/safety_output.txt`). Secret scan: 153 files, 0 findings, 11 fake values suppressed.
- Handoff for final SHA `44b9f57`: `npm run verify` exit 0, 17 suites, 211 tests (verified in a clean `git worktree` of that exact commit).
- The handoff validator rejects code fences, indented code, source keywords, stack traces, HTML, secrets, extra or missing sections, a non-https PR link, a bad SHA, and an unopened PR that is not listed as a blocker.

## Things the audit and tests actually found (and what I did)

1. **Missing controls:** no `CODEOWNERS`, and `.gitignore` did not ignore `.env` or key files. Added both.
2. **A scanner false positive in my own Day 15 test** (`password: "attacker-pw"`, a fake value). I did not weaken the rule: I added an explicit inline `secret-scan:allow` marker so the exception is visible in review, and annotated that one line.
3. **The demo page tripped the scanner** because adjacent string fragments looked like a URL with credentials. I changed how the fragments are split and re-scanned: 0 findings.
4. **A test-fixture bug of mine:** the "tracked .env" test never tracked the file because my fixture's `.gitignore` ignored it. I forced the add in the fixture; the check itself was right.

## Honest notes (Rule 5)

1. **Branch protection, GitHub secret scanning, token scopes and the GitHub audit log are `MANUAL`**: they cannot be verified from a local clone, so the audit says "not verified" instead of passing them. `REPO_SAFETY.md` lists the exact owner steps (GitHub's UI labels change, so search the settings page if a label differs).
2. **PR link: NOT OPENED.** The handoff says so and lists it as a blocker; it needs your GitHub account.
3. A pattern scanner is a safety net, not proof of absence: it misses secrets that match no rule and it flags look-alikes. GitHub's own push protection is the stronger control.
4. The environment check reads variable **names** only, never values.
5. Commits after `44b9f57` for this day add evidence, screenshots and docs only; no source changed.

## Run it

```bash
npx jest day-18 --verbose
npm run safety                                   # exit 1 only if a check FAILS
npm run hooks:install                            # local pre-commit secret scan
node day-18-working-safely/tools/make_handoff.js --sha HEAD
node day-18-working-safely/tools/build_demo.mjs && python3 day-18-working-safely/tools/capture_screenshots.py
```
