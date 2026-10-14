import type { FieldErrors, LeaveFormValues, LeaveRequest } from "./types";

export const MAX_DAYS = 30;
export const REASON_MIN = 10;
export const REASON_MAX = 500;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** True only for real calendar dates ("2026-02-29" is rejected, "2028-02-29" is fine). */
export function isValidISODate(value: string): boolean {
  const m = ISO.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Inclusive number of calendar days: same-day leave is 1 day. */
export function daysInclusive(start: string, end: string): number {
  return Math.round((toMs(end) - toMs(start)) / DAY_MS) + 1;
}

/** Inclusive ranges overlap when each starts on or before the other ends (ISO strings sort correctly). */
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export interface ValidationContext {
  /** Injected so tests and the demo are deterministic. */
  today: string;
  existing: ReadonlyArray<LeaveRequest>;
  employeeId: string;
}

/**
 * Pure validation. At most ONE message per field (the first rule that fails), written for people.
 * The server must run this too: client-side checks are UX, not security (handbook Day 4).
 */
export function validateLeaveRequest(
  values: LeaveFormValues,
  ctx: ValidationContext,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.type) errors.type = "Choose the type of leave.";

  const start = values.startDate;
  const end = values.endDate;
  if (!start) errors.startDate = "Enter a start date.";
  else if (!isValidISODate(start))
    errors.startDate = "Enter a real date, like 2026-11-10.";
  else if (start < ctx.today)
    errors.startDate = `Start date can't be in the past (today is ${ctx.today}).`;

  if (!end) errors.endDate = "Enter an end date.";
  else if (!isValidISODate(end)) errors.endDate = "Enter a real date, like 2026-11-12.";
  else if (!errors.startDate && end < start)
    errors.endDate = "End date can't be before the start date.";
  else if (!errors.startDate && daysInclusive(start, end) > MAX_DAYS) {
    errors.endDate = `Leave can't be longer than ${MAX_DAYS} days (you asked for ${daysInclusive(start, end)}).`;
  }

  if (!errors.startDate && !errors.endDate && start && end) {
    const clash = ctx.existing.find(
      (r) =>
        r.employeeId === ctx.employeeId &&
        r.status === "approved" &&
        overlaps(start, end, r.startDate, r.endDate),
    );
    if (clash)
      errors.startDate = `These dates overlap your approved leave from ${clash.startDate} to ${clash.endDate}.`;
  }

  const reason = values.reason.trim();
  const length = Array.from(reason).length; // code points, so an emoji counts as one character
  if (length === 0) errors.reason = "Tell us why you need leave.";
  else if (length < REASON_MIN)
    errors.reason = `Please give a little more detail (at least ${REASON_MIN} characters, you have ${length}).`;
  else if (length > REASON_MAX)
    errors.reason = `Keep the reason to ${REASON_MAX} characters or fewer (you have ${length}).`;

  return errors;
}

export const hasErrors = (e: FieldErrors): boolean => Object.keys(e).length > 0;
