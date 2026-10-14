import {
  daysInclusive,
  hasErrors,
  isValidISODate,
  overlaps,
  validateLeaveRequest,
  type ValidationContext,
} from "../src/validateLeaveRequest";
import type { LeaveFormValues, LeaveRequest } from "../src/types";

const TODAY = "2026-10-12";
const approved: LeaveRequest = {
  id: "LR-1",
  employeeId: "E-1001",
  type: "annual",
  startDate: "2026-11-02",
  endDate: "2026-11-06",
  reason: "Family wedding trip",
  status: "approved",
};
const ctx = (existing: LeaveRequest[] = [approved]): ValidationContext => ({
  today: TODAY,
  existing,
  employeeId: "E-1001",
});
const valid: LeaveFormValues = {
  type: "annual",
  startDate: "2026-11-10",
  endDate: "2026-11-12",
  reason: "Visiting family for a few days.",
};
const check = (over: Partial<LeaveFormValues>, c = ctx()) =>
  validateLeaveRequest({ ...valid, ...over }, c);

describe("date helpers", () => {
  test.each([
    ["2026-11-10", true],
    ["2028-02-29", true],
    ["2026-02-29", false],
    ["2026-13-01", false],
    ["2026-00-10", false],
    ["2026-04-31", false],
    ["26-11-10", false],
    ["2026-1-5", false],
    ["", false],
    ["not a date", false],
  ])("isValidISODate(%s) = %s", (v, expected) => {
    expect(isValidISODate(v)).toBe(expected);
  });
  test("daysInclusive counts both ends, across months and leap days", () => {
    expect(daysInclusive("2026-11-10", "2026-11-10")).toBe(1);
    expect(daysInclusive("2026-11-10", "2026-11-12")).toBe(3);
    expect(daysInclusive("2026-10-30", "2026-11-02")).toBe(4);
    expect(daysInclusive("2028-02-28", "2028-03-01")).toBe(3);
  });
  test("overlaps is inclusive: touching ranges overlap, adjacent days do not", () => {
    expect(overlaps("2026-11-06", "2026-11-08", "2026-11-02", "2026-11-06")).toBe(true);
    expect(overlaps("2026-11-07", "2026-11-08", "2026-11-02", "2026-11-06")).toBe(false);
    expect(overlaps("2026-10-30", "2026-11-02", "2026-11-02", "2026-11-06")).toBe(true);
  });
});

describe("validateLeaveRequest", () => {
  test("a valid request has no errors", () => {
    expect(validateLeaveRequest(valid, ctx())).toEqual({});
    expect(hasErrors({})).toBe(false);
  });

  test("an empty form reports every field once", () => {
    const e = validateLeaveRequest(
      { type: "", startDate: "", endDate: "", reason: "" },
      ctx(),
    );
    expect(Object.keys(e).sort()).toEqual(["endDate", "reason", "startDate", "type"]);
    expect(e.startDate).toBe("Enter a start date.");
  });

  describe("dates", () => {
    test("start in the past is rejected, today is allowed", () => {
      expect(check({ startDate: "2026-10-11", endDate: "2026-10-13" }).startDate).toMatch(
        /in the past \(today is 2026-10-12\)/,
      );
      expect(check({ startDate: "2026-10-12", endDate: "2026-10-12" })).toEqual({});
    });
    test("end before start is rejected; same day is allowed (1 day)", () => {
      expect(check({ endDate: "2026-11-09" }).endDate).toBe(
        "End date can't be before the start date.",
      );
      expect(check({ startDate: "2026-11-10", endDate: "2026-11-10" })).toEqual({});
    });
    test("30 days is allowed, 31 is rejected with the real number", () => {
      expect(check({ startDate: "2026-12-01", endDate: "2026-12-30" })).toEqual({});
      expect(check({ startDate: "2026-12-01", endDate: "2026-12-31" }).endDate).toBe(
        "Leave can't be longer than 30 days (you asked for 31).",
      );
    });
    test("non-existent dates are rejected, not silently rolled over", () => {
      expect(check({ startDate: "2026-11-31" }).startDate).toMatch(/real date/);
      expect(check({ startDate: "2027-02-29", endDate: "2027-03-02" }).startDate).toMatch(
        /real date/,
      );
      expect(check({ endDate: "2026-13-01" }).endDate).toMatch(/real date/);
    });
    test("leap day 2028-02-29 is accepted", () => {
      expect(check({ startDate: "2028-02-28", endDate: "2028-03-01" })).toEqual({});
    });
    test("an invalid start date does not also produce a confusing end-date error", () => {
      const e = check({ startDate: "garbage", endDate: "2026-11-12" });
      expect(e.startDate).toBeDefined();
      expect(e.endDate).toBeUndefined();
    });
  });

  describe("overlap with approved leave", () => {
    test("overlapping approved leave is rejected and names the clashing dates", () => {
      expect(check({ startDate: "2026-11-04", endDate: "2026-11-08" }).startDate).toBe(
        "These dates overlap your approved leave from 2026-11-02 to 2026-11-06.",
      );
    });
    test("touching the last approved day is an overlap; the next day is fine", () => {
      expect(check({ startDate: "2026-11-06", endDate: "2026-11-07" }).startDate).toMatch(
        /overlap/,
      );
      expect(check({ startDate: "2026-11-07", endDate: "2026-11-08" })).toEqual({});
    });
    test("a request that fully contains approved leave is an overlap", () => {
      expect(check({ startDate: "2026-11-01", endDate: "2026-11-10" }).startDate).toMatch(
        /overlap/,
      );
    });
    test("pending and rejected requests do not block", () => {
      for (const status of ["pending", "rejected"] as const)
        expect(
          check(
            { startDate: "2026-11-03", endDate: "2026-11-05" },
            ctx([{ ...approved, status }]),
          ),
        ).toEqual({});
    });
    test("another employee's approved leave does not block", () => {
      expect(
        check(
          { startDate: "2026-11-03", endDate: "2026-11-05" },
          ctx([{ ...approved, employeeId: "E-2002" }]),
        ),
      ).toEqual({});
    });
  });

  describe("reason", () => {
    test("empty and whitespace-only are rejected as empty", () => {
      expect(check({ reason: "" }).reason).toBe("Tell us why you need leave.");
      expect(check({ reason: "     " }).reason).toBe("Tell us why you need leave.");
    });
    test("too short reports how many characters were given (trimmed)", () => {
      expect(check({ reason: "  short  " }).reason).toBe(
        "Please give a little more detail (at least 10 characters, you have 5).",
      );
    });
    test("10 characters is allowed; 9 is not", () => {
      expect(check({ reason: "1234567890" })).toEqual({});
      expect(check({ reason: "123456789" }).reason).toBeDefined();
    });
    test("500 characters is allowed; 501 is not", () => {
      expect(check({ reason: "a".repeat(500) })).toEqual({});
      expect(check({ reason: "a".repeat(501) }).reason).toBe(
        "Keep the reason to 500 characters or fewer (you have 501).",
      );
    });
    test("emoji count as one character each (code points, not UTF-16 units)", () => {
      expect(check({ reason: "😀".repeat(10) })).toEqual({});
      expect(check({ reason: "😀".repeat(9) }).reason).toMatch(/you have 9/);
    });
  });

  test("an unknown leave type string is treated as not chosen", () => {
    expect(check({ type: "" }).type).toBe("Choose the type of leave.");
  });
});
