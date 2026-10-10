# Day 3 - JavaScript & TypeScript Essentials: Typed Task List

**Lab:** convert an untyped task array into typed data handling; simulate a network call with `async/await`; return Loading / Empty / Error / Success states.

Run: `npx jest day-03-typed-tasks`

## What was built

- `Task` interface (`completedAt: Date | null`) and a `UIState` discriminated union with **four** states (the handbook's snippet shows three; _Empty_ is added because it is a distinct state).
- `fakeFetchTasks()` simulates latency, failure and empty data.
- `loadTasks()` converts any fetch outcome into a `UIState` and never throws.
- `describeState()` uses an exhaustive `switch`; if a new state is added, `tsc` flags the missing case.

## Knowledge check - null vs undefined vs `[]`

- `null`: the value _exists_ and is intentionally "nothing" (task not completed yet).
- `undefined`: the value was _never set / not initialised_ (we have not fetched yet, or a property does not exist - often a bug).
- `[]`: we fetched successfully and the answer is "zero records" -> show an _Empty_ state, not an error or a spinner.
  Treating them as the same hides bugs: an `undefined` list should show Loading, `[]` should show "No tasks yet", and `null` completedAt should render an open task.
