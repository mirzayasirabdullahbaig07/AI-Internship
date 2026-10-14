# Architecture cache (generated - do not hand-edit)

Paste THIS into a prompt instead of letting the AI re-read the repository.

- Owner: Mirza Yasir Abdullah Baig (mirzayasirabdullahbaig07). Repo: AI-Internship.
- Stack: TypeScript + React (components), Node 22 (APIs, node:sqlite), Jest + Testing Library, Playwright (browser), Prettier.
- Verify everything locally: `npm run verify` = prettier --check, tsc --noEmit, jest.
- Conventions: one branch per task, Conventional Commits, no self-merge, fake data only, AI output untrusted.
- Server is the authority (auth, calculation, validation); the client is UX only.

## Folders

- `day-01-profile-card/` - Day 1 - Software Delivery Basics: Static Profile Card
- `day-02-responsive-signin/` - Day 2 - HTML, CSS & Responsive UI: Sign-in Form
- `day-03-typed-tasks/` - Day 3 - JavaScript & TypeScript Essentials: Typed Task List
- `day-04-api-retry/` - Day 4 - APIs & Data Boundaries: Fetch with Retry
- `day-05-password-strength/` - Day 5 - Vibe Coding with Critical Thinking: Password Strength Meter
- `day-06-git-local/` -
- `day-07-github-draft-pr/` - Day 7 - Why GitHub is Used: Push a Branch and Open a Draft PR
- `day-08-pr-review/` -
- `day-09-local-test-matrix/` -
- `day-10-ci-failures/` -
- `day-11-task-agent/` - Day 11 - Task Agents: LoginForm email validation
- `day-12-review-agents/` - Day 12 - Review Agents: audit AI code with an AI reviewer
- `day-13-token-diet/` -

## Scripts

- `npm run test` -> jest
- `npm run typecheck` -> tsc --noEmit
- `npm run format` -> prettier --write .
- `npm run format:check` -> prettier --check .
- `npm run verify` -> npm run format:check && npm run typecheck && npm test
- `npm run test:vulnerable` -> cross-env TARGET=vulnerable jest day-12-review-agents/tests/security.test.js
- `npm run demo:day12` -> npm run demo:build && node day-12-review-agents/src/server.js
- `npm run demo:build` -> node day-12-review-agents/tools/build_demo.mjs
