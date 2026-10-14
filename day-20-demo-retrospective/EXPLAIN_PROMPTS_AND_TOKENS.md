# Day 20 - The prompts used, and the token-optimisation choices

> **Honest note on authorship.** In this repository the work was produced by Claude from your instructions. The handbook's pass rule is that you can explain your own code and tests **without reading an AI answer**, so `STUDY_GUIDE.md` is there to help you do that. The "prompts" below are the bounded prompts this work followed (they exist as files); this is not a transcript of what you typed.

## The prompt chain for the capstone

| Step              | Prompt (file)                                                                                                                                           | Bounded by                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1. Brief          | `day-13-token-diet/outputs/task_brief_150.txt` (123 words)                                                                                              | Goal, Scope, Do not, Return; all 13 acceptance criteria kept |
| 2. Plan first     | The same brief ending `Return: a plan first, then a diff` -> `day-19.../DAY19_PLAN.md`                                                                  | The human approved the plan before any code                  |
| 3. Build in steps | One bounded request per commit (validation -> API -> form -> styles -> flow -> audit)                                                                   | One concern, one commit, tests with it                       |
| 4. Review         | The Day 12 brief (`day-12-review-agents/review-input/REVIEW_BRIEF.txt`) applied to the diff                                                             | Risk level, line, required fix; no style comments            |
| 5. Probe          | Two questions that found the two product bugs: **"What else can make this error false?"** and **"What happens to focus when this control disappears?"** | Each answered by reproducing it, not by opinion              |

## Token-optimisation choices, with measured numbers

| Choice                                         | Measured result                                                                                           | Where                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Short brief** instead of the verbose request | 1,177 words -> 123 words (-89.5%); ~1,646 -> ~203 estimated tokens (-87.7%); 13/13 criteria kept          | Day 13 `evidence/metrics.txt`       |
| **Markdown cache** of the architecture         | ~487 vs ~22,920 estimated tokens for the whole repo source at the time (-97.9%)                           | Day 13 `evidence/cache_metrics.txt` |
| **Targeted diffs**, not the repo               | The Day 12 reviewer saw a 194-line diff, not the ~6,000 source lines of the repo                          | Day 12 `PR-104.diff`                |
| **Small commits** so each review is small      | The capstone is 21 files / 955 source lines in 6 focused commits                                          | Day 19 `DAY19_PLAN.md`              |
| **Plan first**                                 | A wrong plan costs a few hundred tokens to correct; a wrong implementation costs thousands                | Day 13 `PLAN_FIRST.md`              |
| **Let tools verify**, not the model            | Prettier, tsc, Jest, axe-core, Playwright decide pass/fail: no tokens spent re-reading code to "check" it | `npm run verify`                    |
| **One agent per bounded task**                 | No multi-agent swarm; the AI-COO only coordinates (Days 16-17)                                            | Day 17                              |

## What I would not claim

- Token numbers are a **characters / 4 estimate**, not a real tokenizer.
- I did not measure model-tier switching (cheap vs reasoning models); `day-13.../MODEL_TIERS.md` is guidance, not a measured result.
- "Quality was preserved" is shown by the criteria checker and the tests, not by a human blind comparison.
