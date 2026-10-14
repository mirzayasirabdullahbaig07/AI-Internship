# Day 13 - Keeping AI Token Use Low

**Author:** Mirza Yasir Abdullah Baig - AI Engineer (`mirzayasirabdullahbaig07`)

**Lab:** take an overly verbose ~1,000-word prompt (company history, emotional pleas) and cut it to a sterile 150-word task brief without losing the core acceptance criteria.

## Result (measured, `evidence/metrics.txt`)

|                | Words  | Est. tokens | Noise markers | Criteria kept |
| -------------- | ------ | ----------- | ------------- | ------------- |
| Verbose prompt | 1,177  | ~1,646      | 12/12         | 13/13         |
| Task brief     | 123    | ~203        | 0/12          | 13/13         |
| Reduction      | -89.5% | -87.7%      |               |               |

The brief uses the handbook's Standard Task Prompt Structure (Goal / Scope / Do not / Return) and keeps all 13 acceptance criteria.
It is deliberately about the Leave Request form, so it doubles as the Day 19 capstone brief.

## The five strategies, applied

| Strategy                          | Where                                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Short briefs                      | `outputs/task_brief_150.txt`                                                                                                                   |
| Targeted diffs                    | Day 12 sent a 194-line diff, not the repo                                                                                                      |
| Plan first                        | `outputs/PLAN_FIRST.md`                                                                                                                        |
| Single agent per bounded task     | one brief, one owner, one branch                                                                                                               |
| Markdown caching                  | `outputs/ARCHITECTURE_CACHE.md` (generated) - ~487 est. tokens vs ~22,920 est. tokens for the whole repo source (`evidence/cache_metrics.txt`) |
| Tiered models / free-tier fallacy | `outputs/MODEL_TIERS.md`                                                                                                                       |

## Run it

```bash
npx jest day-13 --verbose
node day-13-token-diet/tools/report_metrics.js
node day-13-token-diet/tools/build_cache.js
node day-13-token-diet/tools/build_demo.js && python3 day-13-token-diet/tools/capture_screenshots.py
```

## Honest notes

1. **The 1,000-word prompt is one I wrote** (the instructor's was not available). It is 1,177 words and contains the same kinds of noise.
2. **Token numbers are an estimate** (characters / 4), not a real tokenizer. Word counts and criteria checks are exact.
3. "No criterion lost" is checked by regular expressions plus a negative control (deleting the 30-day line makes the checker report `C6` as lost). Regexes can miss paraphrases, so a human still reads the brief.
4. Reason length 10-500 is my concrete choice for the original's "sensible minimum and maximum".
