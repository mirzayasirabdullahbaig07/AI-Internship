/** Dates are ISO calendar dates ("2026-11-10"). All sample data is FAKE. */
export type LeaveType = "annual" | "sick" | "casual";
export type LeaveStatus = "approved" | "pending" | "rejected";

export const LEAVE_TYPES: ReadonlyArray<{ value: LeaveType; label: string }> = [
  { value: "annual", label: "Annual leave" },
  { value: "sick", label: "Sick leave" },
  { value: "casual", label: "Casual leave" },
];

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

/** What the form holds while the user types ("" = not chosen yet). */
export interface LeaveFormValues {
  type: LeaveType | "";
  startDate: string;
  endDate: string;
  reason: string;
}

export type FieldName = keyof LeaveFormValues;
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Every data fetch has four UI states (handbook, Day 3). */
export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; data: T };
