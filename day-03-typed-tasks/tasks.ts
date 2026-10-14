export interface Task {
  id: string;
  title: string;
  completedAt: Date | null; // null = explicitly NOT completed
}

/** Every data fetch has four UI states: loading, empty, error, success. */
export type UIState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "success"; data: Task[] };

export const initialState: UIState = { status: "loading" };

export const sampleTasks: Task[] = [
  {
    id: "t1",
    title: "Write profile card",
    completedAt: new Date("2026-10-01T10:00:00Z"),
  },
  { id: "t2", title: "Make sign-in responsive", completedAt: null },
  { id: "t3", title: "Type the task list", completedAt: null },
];

export interface FakeFetchOptions {
  delayMs?: number;
  fail?: boolean;
  data?: Task[];
}

/** Simulates a network call. */
export async function fakeFetchTasks({
  delayMs = 50,
  fail = false,
  data = sampleTasks,
}: FakeFetchOptions = {}): Promise<Task[]> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (fail) throw new Error("Network error: could not load tasks");
  return data;
}

/** Turns a fetch result into one of the explicit UI states. */
export async function loadTasks(fetcher: () => Promise<Task[]>): Promise<UIState> {
  try {
    const data = await fetcher();
    return data.length === 0 ? { status: "empty" } : { status: "success", data };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Text a UI would render for each state (exhaustive switch: compiler flags a missing case). */
export function describeState(state: UIState): string {
  switch (state.status) {
    case "loading":
      return "Loading tasks...";
    case "empty":
      return "No tasks yet.";
    case "error":
      return `Something went wrong: ${state.message}`;
    case "success":
      return `${state.data.filter((t) => t.completedAt === null).length} of ${state.data.length} tasks open`;
  }
}
