# Tiered models (Day 13 strategy)

Use the cheapest model that can do the job; reserve heavy reasoning for work that needs it.

| Task                                      | Tier                     | Why                                      |
| ----------------------------------------- | ------------------------ | ---------------------------------------- |
| Summarise a CI log, locate a file         | Small / fast / local     | Pattern matching, low risk               |
| Reformat a brief, rename, boilerplate     | Small / fast             | Mechanical                               |
| Implement one bounded task from a brief   | Mid-tier                 | Needs care, bounded scope                |
| Security review, architecture, hard debug | Large reasoning model    | Mistakes are expensive                   |
| Verifying a result                        | NO model: run the checks | Linters, tsc, tests and `git diff` first |

**Free-tier fallacy:** never use a free tier as production verification. Availability changes and context may be truncated.
Verification = local `npm run verify`, not a chatbot's opinion.
