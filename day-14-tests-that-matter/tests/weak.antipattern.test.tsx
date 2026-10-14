import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";

const LoginForm = require(
  process.env.LOGINFORM_PATH ?? "../../day-11-task-agent/LoginForm",
).default as ComponentType<{ token?: string; apiBase?: string }>;

/**
 * ANTI-EXAMPLE - the kind of tests an AI generates in seconds. They all pass, and they prove almost
 * nothing. tools/mutation_check.js measures how many real bugs they catch (spoiler: none).
 */
describe("weak AI-style tests (do NOT copy)", () => {
  test("component is defined", () => {
    expect(LoginForm).toBeDefined();
  });
  test("renders without crashing", () => {
    render(<LoginForm />);
  });
  test("has a button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  test("has an input", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
  });
  test("true is true", () => {
    expect(true).toBe(true);
  });
});
