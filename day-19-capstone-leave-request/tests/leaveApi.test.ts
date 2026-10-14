import {
  CURRENT_EMPLOYEE,
  createFakeApi,
  SubmitValidationError,
  todayISO,
} from "../src/leaveApi";
import type { LeaveFormValues } from "../src/types";

const TODAY = "2026-10-12";
const api = (scenario?: Parameters<typeof createFakeApi>[0]["scenario"]) =>
  createFakeApi({ today: TODAY, scenario, delayMs: 0 });
const good: LeaveFormValues = {
  type: "annual",
  startDate: "2026-11-10",
  endDate: "2026-11-12",
  reason: "Visiting family for a few days.",
};

describe("fake leave API (typed, local, FAKE data)", () => {
  test("lists only the signed-in employee's requests (other employees' leave is never returned)", async () => {
    const list = await api().listRequests();
    expect(list).toHaveLength(4);
    expect(list.every((r) => r.employeeId === CURRENT_EMPLOYEE.id)).toBe(true);
  });

  test("empty scenario returns no requests", async () => {
    expect(await api("empty").listRequests()).toEqual([]);
  });

  test("error scenario fails the first load and succeeds on retry", async () => {
    const a = api("error");
    await expect(a.listRequests()).rejects.toThrow(/couldn't reach/);
    await expect(a.listRequests()).resolves.toHaveLength(4);
  });

  test("a valid submission is stored as pending and appears in the next list", async () => {
    const a = api();
    const created = await a.submitRequest(good);
    expect(created).toMatchObject({
      status: "pending",
      type: "annual",
      startDate: "2026-11-10",
      employeeId: "E-1001",
    });
    expect((await a.listRequests()).map((r) => r.id)).toContain(created.id);
  });

  test("another employee's approved leave on the same dates does not block Sana", async () => {
    await expect(api().submitRequest(good)).resolves.toBeDefined(); // LR-2001 (E-2002) covers 2026-11-10..12
  });

  test("the SERVER re-validates: an invalid request is rejected even if the client skipped its checks", async () => {
    const err = await api()
      .submitRequest({ ...good, endDate: "2026-11-01" })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SubmitValidationError);
    expect((err as SubmitValidationError).fieldErrors.endDate).toMatch(
      /before the start/,
    );
  });

  test("the server also rejects overlap with the employee's approved leave", async () => {
    const err = await api()
      .submitRequest({ ...good, startDate: "2026-11-04", endDate: "2026-11-05" })
      .catch((e: unknown) => e);
    expect((err as SubmitValidationError).fieldErrors.startDate).toMatch(/overlap/);
  });

  test("submit-error scenario fails once, then works; nothing was saved by the failure", async () => {
    const a = api("submit-error");
    await expect(a.submitRequest(good)).rejects.toThrow(/unavailable/);
    expect(await a.listRequests()).toHaveLength(4);
    await expect(a.submitRequest(good)).resolves.toBeDefined();
    expect(await a.listRequests()).toHaveLength(5);
  });

  test("ids are unique and returned objects are copies (mutating them cannot corrupt the store)", async () => {
    const a = api();
    const first = await a.submitRequest(good);
    const second = await a.submitRequest({
      ...good,
      startDate: "2026-12-01",
      endDate: "2026-12-02",
    });
    expect(first.id).not.toBe(second.id);
    first.reason = "tampered";
    const stored = (await a.listRequests()).find((r) => r.id === first.id);
    expect(stored?.reason).toBe("Visiting family for a few days.");
  });

  test("todayISO uses the LOCAL calendar date, zero-padded", () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(todayISO(new Date(2026, 9, 12, 0, 1))).toBe("2026-10-12");
  });
});
