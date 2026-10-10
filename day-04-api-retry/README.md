# Day 4 - APIs & Data Boundaries: Fetch with Retry

**Lab:** consume an API with boundary awareness; add a retry wrapper that survives simulated network drops.

Run: `npx jest day-04-api-retry` (uses a real local HTTP server that destroys the first two connections).
`fetchPosts()` targets JSONPlaceholder and needs internet - it was _not_ run in this environment.

## Design decisions (improving on the handbook snippet)

- 4xx errors (401/403/400) are **not** retried - they cannot succeed on retry. Network drops and 5xx are retried.
- Exponential backoff (`baseDelayMs * 2^attempt`) instead of hammering the server instantly.
- `fetchImpl` is injectable for tests; the token is a parameter, never hard-coded.

## Knowledge check - three cases where the client MUST NOT be trusted

1. **Cart totals / prices:** a user can edit the JS or the request body to set price = 0. The server recomputes totals from its own price table.
2. **Admin access / roles:** hiding the "Admin" button or sending `isAdmin: true` proves nothing. The server checks the role from the verified token/session on every request.
3. **Tenant data access:** a client can change `?tenantId=UserB`. The server derives the tenant from the authenticated identity and ignores client-supplied IDs.
   (Also: input validation, rate limits, "already paid" flags - all enforced server-side. Client-side checks are only UX.)
