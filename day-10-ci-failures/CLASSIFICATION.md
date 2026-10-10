# Day 10 - Classify CI Outputs

> **Honest note:** the instructor provides five official logs in the lab. These five are **sample logs I wrote** (`sample-logs/`) to practise the same classification; replace/extend with the instructor's logs.

| Log  | Classification               | Evidence in the log                                                   | Whose problem?                                                         | Honest status wording                              |
| ---- | ---------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| log1 | **Code failure**             | Assertion failed: `toHaveStyle` expected `color: red`, received none  | Mine - fix the code/test                                               | "Failed: 1 test"                                   |
| log2 | **Baseline failure (flaky)** | Same test fails on `main` with zero changes; PR only touched a README | Pre-existing - compare against `main`; report, do not "fix" in this PR | "Failed on baseline too; unrelated to this change" |
| log3 | **Infrastructure block**     | Docker Hub `toomanyrequests` pull limit; 0 steps ran after            | Platform - retry later / authenticate pulls                            | "**Not Run** - blocked by Docker rate limit"       |
| log4 | **Code failure**             | `error TS2339` compile error in my file                               | Mine                                                                   | "Failed: type error TS2339 at tasks.ts:41"         |
| log5 | **Infrastructure block**     | Billing/spending limit; "Steps executed: 0 of 6"                      | Platform/account                                                       | "**Not Run** - billing limit; no checks executed"  |

## Decision rules used

1. Did a test assertion or compile step run and fail? -> **Code**.
2. Does the same failure happen on `main` / unchanged code? -> **Baseline (flaky)**.
3. Did the runner, registry, quota or billing stop the job before checks ran? -> **Infra**. A job with zero executed steps is **Not Run**, never "Passed".
