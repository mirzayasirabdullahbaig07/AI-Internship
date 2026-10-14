import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CURRENT_EMPLOYEE, SubmitValidationError, type LeaveApi } from "./leaveApi";
import {
  LEAVE_TYPES,
  type FieldErrors,
  type FieldName,
  type LeaveFormValues,
  type LeaveRequest,
  type LoadState,
} from "./types";
import {
  daysInclusive,
  hasErrors,
  REASON_MAX,
  REASON_MIN,
  validateLeaveRequest,
} from "./validateLeaveRequest";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; request: LeaveRequest }
  | { status: "error"; message: string };

const EMPTY: LeaveFormValues = { type: "", startDate: "", endDate: "", reason: "" };
const FIELD_LABEL: Record<FieldName, string> = {
  type: "Leave type",
  startDate: "Start date",
  endDate: "End date",
  reason: "Reason",
};
const STATUS_LABEL = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
} as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-11-10" -> "10 Nov 2026" (no locale: the same text everywhere). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}
const typeLabel = (t: string) => LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error && (
        <p id={`${id}-error`} className="field-error">
          <strong>Error:</strong> {error}
        </p>
      )}
    </div>
  );
}

export interface LeaveRequestFormProps {
  api: LeaveApi;
  /** Injected "today" (YYYY-MM-DD) so the form and its tests are deterministic. */
  today: string;
}

export default function LeaveRequestForm({ api, today }: LeaveRequestFormProps) {
  const uid = useId();
  const fieldId = (f: FieldName) => `${uid}-${f}`;

  const [list, setList] = useState<LoadState<LeaveRequest[]>>({ status: "loading" });
  const [values, setValues] = useState<LeaveFormValues>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState<FieldErrors | null>(null);
  const [summaryNonce, setSummaryNonce] = useState(0);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const retryRef = useRef(false);

  const load = useCallback(() => {
    let cancelled = false;
    setList({ status: "loading" });
    api
      .listRequests()
      .then(
        (rows) =>
          !cancelled &&
          setList(
            rows.length === 0 ? { status: "empty" } : { status: "success", data: rows },
          ),
      )
      .catch(
        (err: unknown) =>
          !cancelled &&
          setList({
            status: "error",
            message: err instanceof Error ? err.message : "Something went wrong.",
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [api]);
  useEffect(() => load(), [load]);

  useEffect(() => {
    if (summaryNonce > 0) summaryRef.current?.focus();
  }, [summaryNonce]);
  useEffect(() => {
    if (submit.status === "success") successRef.current?.focus();
  }, [submit]);
  useEffect(() => {
    // "Try again" removes the focused button; park focus on the stable heading so keyboard users keep their place.
    if (retryRef.current && list.status === "loading") {
      listHeadingRef.current?.focus();
      retryRef.current = false;
    }
  }, [list]);

  const existing = list.status === "success" ? list.data : [];
  const liveErrors = validateLeaveRequest(values, {
    today,
    existing,
    employeeId: CURRENT_EMPLOYEE.id,
  });
  const errors: FieldErrors = { ...serverErrors, ...(showErrors ? liveErrors : {}) };
  const summaryEntries = (Object.entries(summary ?? {}) as [FieldName, string][])
    .filter(([f]) => errors[f])
    .map(([f]) => [f, errors[f] as string] as const);

  function change<K extends FieldName>(field: K, value: LeaveFormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    // Server-side errors can depend on several fields (an overlap depends on BOTH dates), so any edit
    // clears them all; the server re-validates on the next submit. Clearing only this field left stale errors.
    setServerErrors({});
    if (submit.status === "success" || submit.status === "error")
      setSubmit({ status: "idle" });
  }

  function showSummary(found: FieldErrors) {
    setShowErrors(true);
    setSummary(found);
    setSummaryNonce((n) => n + 1);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submit.status === "submitting") return;
    if (hasErrors(liveErrors)) {
      showSummary(liveErrors);
      return;
    }
    setSummary(null);
    setSubmit({ status: "submitting" });
    try {
      const created = await api.submitRequest(values);
      setSubmit({ status: "success", request: created });
      setValues(EMPTY);
      setShowErrors(false);
      setServerErrors({});
      setList((prev) => ({
        status: "success",
        data: [...(prev.status === "success" ? prev.data : []), created],
      }));
    } catch (err) {
      if (err instanceof SubmitValidationError) {
        setServerErrors(err.fieldErrors);
        showSummary(err.fieldErrors);
        setSubmit({ status: "idle" });
      } else {
        setSubmit({
          status: "error",
          message:
            "We couldn't submit your request. Nothing was saved. Please try again.",
        });
      }
    }
  }

  const reasonCount = Array.from(values.reason.trim()).length;
  const submitting = submit.status === "submitting";

  return (
    <div className="leave-app">
      <header className="app-header">
        <h1>Leave requests</h1>
        <p className="muted">Signed in as {CURRENT_EMPLOYEE.name} (fake demo user)</p>
      </header>

      <div className="layout">
        <section aria-labelledby={`${uid}-form-h`} className="card">
          <h2 id={`${uid}-form-h`}>Request leave</h2>
          <p className="muted">All fields are required.</p>

          {submit.status === "success" && (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="banner banner-success"
            >
              <strong>Request {submit.request.id} submitted.</strong>{" "}
              {typeLabel(submit.request.type)} from {formatDate(submit.request.startDate)}{" "}
              to {formatDate(submit.request.endDate)}. Status: Pending.
            </div>
          )}
          {submit.status === "error" && (
            <div role="alert" className="banner banner-error">
              {submit.message}
            </div>
          )}
          {summaryEntries.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="alert" className="error-summary">
              <h3>
                {summaryEntries.length === 1
                  ? "There is 1 problem with your request"
                  : `There are ${summaryEntries.length} problems with your request`}
              </h3>
              <ul>
                {summaryEntries.map(([field, message]) => (
                  <li key={field}>
                    <a
                      href={`#${fieldId(field)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(fieldId(field))?.focus();
                      }}
                    >
                      {FIELD_LABEL[field]}: {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <Field id={fieldId("type")} label="Leave type" error={errors.type}>
              {(aria) => (
                <select
                  {...aria}
                  name="type"
                  value={values.type}
                  onChange={(e) =>
                    change("type", e.target.value as LeaveFormValues["type"])
                  }
                >
                  <option value="">Choose a type</option>
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="date-row">
              <Field
                id={fieldId("startDate")}
                label="Start date"
                error={errors.startDate}
              >
                {(aria) => (
                  <input
                    {...aria}
                    type="date"
                    name="startDate"
                    min={today}
                    value={values.startDate}
                    onChange={(e) => change("startDate", e.target.value)}
                  />
                )}
              </Field>
              <Field id={fieldId("endDate")} label="End date" error={errors.endDate}>
                {(aria) => (
                  <input
                    {...aria}
                    type="date"
                    name="endDate"
                    min={values.startDate || today}
                    value={values.endDate}
                    onChange={(e) => change("endDate", e.target.value)}
                  />
                )}
              </Field>
            </div>
            {values.startDate &&
              values.endDate &&
              !errors.startDate &&
              !errors.endDate &&
              !liveErrors.endDate && (
                <p className="muted" aria-live="polite">
                  {daysInclusive(values.startDate, values.endDate)} day(s) requested
                </p>
              )}
            <Field
              id={fieldId("reason")}
              label="Reason"
              hint={`${REASON_MIN}-${REASON_MAX} characters. You have used ${reasonCount}.`}
              error={errors.reason}
            >
              {(aria) => (
                <textarea
                  {...aria}
                  name="reason"
                  rows={4}
                  value={values.reason}
                  onChange={(e) => change("reason", e.target.value)}
                />
              )}
            </Field>
            <button type="submit" className="primary" aria-disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </form>
        </section>

        <section aria-labelledby={`${uid}-list-h`} className="card">
          <h2 id={`${uid}-list-h`} ref={listHeadingRef} tabIndex={-1}>
            My requests
          </h2>
          {list.status === "loading" && (
            <div role="status" className="state">
              <span className="spinner" aria-hidden="true" /> Loading your leave
              requests...
            </div>
          )}
          {list.status === "error" && (
            <div role="alert" className="state state-error">
              <p>
                <strong>We couldn't load your requests.</strong> {list.message}
              </p>
              <button
                type="button"
                onClick={() => {
                  retryRef.current = true;
                  load();
                }}
              >
                Try again
              </button>
            </div>
          )}
          {list.status === "empty" && (
            <div className="state">
              <p>
                <strong>No leave requests yet.</strong>
              </p>
              <p className="muted">When you submit a request, it will appear here.</p>
            </div>
          )}
          {list.status === "success" && (
            <ul className="request-list">
              {[...list.data]
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((r) => (
                  <li key={r.id}>
                    <div className="request-head">
                      <strong>{typeLabel(r.type)}</strong>
                      <span className={`badge badge-${r.status}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <div>
                      {formatDate(r.startDate)} to {formatDate(r.endDate)} (
                      {daysInclusive(r.startDate, r.endDate)} day
                      {daysInclusive(r.startDate, r.endDate) === 1 ? "" : "s"})
                    </div>
                    <div className="muted">{r.reason}</div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
