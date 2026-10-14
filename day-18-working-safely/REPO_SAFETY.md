# Repository safety for agent work (Day 18)

Agents must run in environments with **secret scanning enabled, branch protection enforced and strict audit logs**, and **never receive production credentials**.
`npm run safety` checks what a local clone can prove. The items below are GitHub settings **only the repository owner can enable** - the audit reports them as `MANUAL` (not verified), never as a pass.

## 1. Branch protection on `main` (owner action)

GitHub -> repository **Settings** -> **Branches** (or **Rules** -> **Rulesets**) -> add a rule for `main`:

- Require a pull request before merging, with **at least 1 approval**
- Require status checks to pass (add the `verify` check from `.github/workflows/verify.yml`)
- Require conversation resolution before merging
- Block force pushes and branch deletion
- Do **not** allow bypassing for administrators, if you want the rule to bind you too

Why: Non-negotiable Rule 4 (no merging your own PR) is only a promise until the platform enforces it. Note GitHub never lets an author approve their own PR, so a second human reviewer is still required (see Day 16).

## 2. Secret scanning and push protection (owner action)

**Settings** -> **Advanced Security** / **Code security** -> enable **Secret scanning** and **Push protection**.
Push protection blocks a push that contains a recognised secret _before_ it reaches the repository. Labels move around in the GitHub UI; if you cannot find them, search the settings page for "secret".

## 3. Least-privilege agent credentials (owner action)

- Use a **fine-grained personal access token** limited to **this repository only**
- Permissions: Contents **read/write** (for branches), Pull requests **read/write**; **no** Administration, **no** merge rights
- Short expiry; never paste it into a prompt or commit it
- If a token or key ever lands in a prompt, a commit or a log: **rotate it immediately**; deleting the commit is not enough

## 4. Audit logs

Locally, `git log` is an attributable trail (author, email, message, time). On GitHub, review **Settings -> Security log** (personal account) or the organisation **Audit log**.

## 5. What this repo already enforces locally

| Control                                                                                     | Where                                  |
| ------------------------------------------------------------------------------------------- | -------------------------------------- |
| Secret scanner (10 rules, redacted output, inline allow marker)                             | `src/secretScanner.js`                 |
| Audit of tracked files, `.gitignore`, `.env`, CODEOWNERS, PR template, history, environment | `src/repoSafety.js`, `npm run safety`  |
| Pre-commit hook that scans **staged** content                                               | `src/hook.js`, `npm run hooks:install` |
| Review ownership                                                                            | `.github/CODEOWNERS`                   |
| Agents cannot merge; the author cannot approve                                              | Day 16 validator, Day 17 lifecycle     |

## 6. If a secret is found

1. Treat it as compromised and **rotate/revoke it first**.
2. Remove it from the code and from history if necessary (`git filter-repo`), then force-push only with the owner's approval.
3. Record what happened in the handoff blockers. Do not hide it (Rule 5).
