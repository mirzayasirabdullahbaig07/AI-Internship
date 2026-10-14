import type { FieldErrors, LeaveFormValues, LeaveRequest } from "./types";
import { hasErrors, validateLeaveRequest } from "./validateLeaveRequest";

/** FAKE people and data only. Nothing here is a real employee. */
export const CURRENT_EMPLOYEE = { id: "E-1001", name: "Sana Malik" } as const;

export const SEED_REQUESTS: ReadonlyArray<LeaveRequest> = [
  {
    id: "LR-1001",
    employeeId: "E-1001",
    type: "annual",
    startDate: "2026-11-02",
    endDate: "2026-11-06",
    reason: "Family wedding trip",
    status: "approved",
  },
  {
    id: "LR-1002",
    employeeId: "E-1001",
    type: "sick",
    startDate: "2026-09-14",
    endDate: "2026-09-15",
    reason: "Flu and a doctor's visit",
    status: "approved",
  },
  {
    id: "LR-1003",
    employeeId: "E-1001",
    type: "casual",
    startDate: "2026-10-20",
    endDate: "2026-10-20",
    reason: "Bank and passport appointment",
    status: "pending",
  },
  {
    id: "LR-1004",
    employeeId: "E-1001",
    type: "annual",
    startDate: "2026-12-24",
    endDate: "2026-12-26",
    reason: "Extra days over the holidays",
    status: "rejected",
  },
  // Another (fake) employee: must never be listed to Sana and must never block her dates.
  {
    id: "LR-2001",
    employeeId: "E-2002",
    type: "annual",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    reason: "Colleague's leave",
    status: "approved",
  },
];

/** normal | empty (no requests yet) | error (first list call fails, retry works) | slow (long loading) | submit-error (first submit fails). */
export type Scenario = "normal" | "empty" | "error" | "slow" | "submit-error";

/** Thrown by the (fake) server when it re-validates a submission: the client is never trusted. */
export class SubmitValidationError extends Error {
  constructor(public readonly fieldErrors: FieldErrors) {
    super("The server rejected the request");
    this.name = "SubmitValidationError";
  }
}

export interface LeaveApi {
  listRequests(): Promise<LeaveRequest[]>;
  submitRequest(values: LeaveFormValues): Promise<LeaveRequest>;
}

export interface FakeApiOptions {
  today: string;
  scenario?: Scenario;
  delayMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Local calendar date as YYYY-MM-DD (not toISOString, which is UTC and can be off by a day). */
export function todayISO(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function createFakeApi({
  today,
  scenario = "normal",
  delayMs = 300,
}: FakeApiOptions): LeaveApi {
  const store: LeaveRequest[] =
    scenario === "empty" ? [] : SEED_REQUESTS.map((r) => ({ ...r }));
  let listCalls = 0;
  let submitCalls = 0;
  let nextId = 3001;

  return {
    async listRequests() {
      listCalls++;
      await wait(scenario === "slow" ? Math.max(delayMs, 4000) : delayMs);
      if (scenario === "error" && listCalls === 1)
        throw new Error("Network error: we couldn't reach the leave service.");
      return store
        .filter((r) => r.employeeId === CURRENT_EMPLOYEE.id)
        .map((r) => ({ ...r }));
    },

    async submitRequest(values) {
      submitCalls++;
      await wait(delayMs);
      if (scenario === "submit-error" && submitCalls === 1)
        throw new Error("The leave service is unavailable.");
      const errors = validateLeaveRequest(values, {
        today,
        existing: store,
        employeeId: CURRENT_EMPLOYEE.id,
      });
      if (hasErrors(errors)) throw new SubmitValidationError(errors);
      const created: LeaveRequest = {
        id: `LR-${nextId++}`,
        employeeId: CURRENT_EMPLOYEE.id,
        type: values.type as LeaveRequest["type"],
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason.trim(),
        status: "pending",
      };
      store.push(created);
      return { ...created };
    },
  };
}
