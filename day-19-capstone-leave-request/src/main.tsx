// Demo entry only (bundled by tools/build_demo.mjs). Query parameters pick the fake API scenario:
//   ?scenario=normal|empty|error|slow|submit-error   ?today=2026-10-12   ?delay=300
import { createRoot } from "react-dom/client";
import "./styles.css";
import LeaveRequestForm from "./LeaveRequestForm";
import { createFakeApi, type Scenario } from "./leaveApi";

const params = new URLSearchParams(window.location.search);
const known: Scenario[] = ["normal", "empty", "error", "slow", "submit-error"];
const asked = params.get("scenario") as Scenario | null;
const scenario: Scenario = asked && known.includes(asked) ? asked : "normal";
const today = params.get("today") ?? "2026-10-12"; // fixed so the demo is deterministic
const delayMs = Number(params.get("delay") ?? 300);

createRoot(document.getElementById("root") as HTMLElement).render(
  <LeaveRequestForm api={createFakeApi({ today, scenario, delayMs })} today={today} />,
);
