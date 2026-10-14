# Plan first, code second (Day 13 strategy)

Prompt sent: the 150-word brief, ending with `Return: a plan first, then a diff.`
The AI is asked to return ONLY this plan. Code is requested after the human approves it.

## Plan returned for the Leave Request form (reviewed and approved before any code)

1. `leave.types.ts` - `LeaveType`, `LeaveRequest`, `Status` types; fake data only.
2. `validateLeaveRequest.ts` - pure function, one rule per acceptance check.
3. `leaveApi.ts` - simulated async calls (list, submit) with loading, empty and error scenarios.
4. `LeaveRequestForm.tsx` - labelled fields, inline errors, focus moves to an error summary.
5. `LeaveRequestForm.test.tsx` - ONE component test (invalid, then valid submission).
6. `leaveFlow` browser test - ONE Playwright journey.
7. Small commits per step; Draft PR; no self-merge.

Why this saves tokens: a wrong plan costs ~200 tokens to correct. A wrong 400-line implementation costs thousands.
