import { describeState, fakeFetchTasks, initialState, loadTasks } from "./tasks";

describe("loadTasks - the four UI states", () => {
  test("starts in loading", () => {
    expect(initialState).toEqual({ status: "loading" });
    expect(describeState(initialState)).toBe("Loading tasks...");
  });

  test("success: returns the tasks", async () => {
    const state = await loadTasks(() => fakeFetchTasks({ delayMs: 1 }));
    expect(state.status).toBe("success");
    if (state.status === "success") expect(state.data).toHaveLength(3);
    expect(describeState(state)).toBe("2 of 3 tasks open");
  });

  test("empty: request succeeded but 0 records", async () => {
    const state = await loadTasks(() => fakeFetchTasks({ delayMs: 1, data: [] }));
    expect(state).toEqual({ status: "empty" });
    expect(describeState(state)).toBe("No tasks yet.");
  });

  test("error: network failure is captured, not thrown", async () => {
    const state = await loadTasks(() => fakeFetchTasks({ delayMs: 1, fail: true }));
    expect(state).toEqual({
      status: "error",
      message: "Network error: could not load tasks",
    });
    expect(describeState(state)).toContain("Something went wrong");
  });

  test("error: non-Error throw still produces a safe message", async () => {
    const state = await loadTasks(() => Promise.reject("boom"));
    expect(state).toEqual({ status: "error", message: "Unknown error" });
  });
});

describe("null vs undefined vs []", () => {
  test("they are three different realities", () => {
    const completedAt: Date | null = null; // task exists, explicitly not completed
    let notInitialised: string[] | undefined; // never fetched / never set
    const fetchedNothing: string[] = []; // fetched fine, zero records
    expect(completedAt).toBeNull();
    expect(notInitialised).toBeUndefined();
    expect(fetchedNothing).toHaveLength(0);
    expect(fetchedNothing).not.toBeUndefined();
    expect(fetchedNothing).not.toBeNull();
    notInitialised = fetchedNothing; // after the fetch it becomes []
    expect(notInitialised).toEqual([]);
  });
});
