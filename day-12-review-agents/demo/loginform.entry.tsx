import { createRoot } from "react-dom/client";
import LoginForm from "../../day-11-task-agent/LoginForm";

createRoot(document.getElementById("root") as HTMLElement).render(
  <LoginForm token="token-yasir" apiBase="/fixed" />,
);
